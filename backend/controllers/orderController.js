const mongoose = require('mongoose');
const Order = require('../models/Order');
const { orderSchema, deliveryDateSchema } = require('../validations/orderValidation');
const Joi = require('joi');
const { validateProducts, reduceInventory, restoreInventory } = require('../utils/productUtils');
const Product = require('../models/Product');
const moment = require('moment-timezone'); // Importa moment-timezone
const { hasSandboxWompiCredentials } = require('../utils/wompiSecurity');

// Función para actualizar el estado del pedido automáticamente
const updateOrderStatus = async (order) => {
  const previousStatus = order.status;

  if (order.status === 'Pendiente' && order.paymentConfirmed) {
    order.status = 'Procesando';
  } else if (order.status === 'Procesando' && order.packed) {
    order.status = 'Enviado';
  } else if (order.status === 'Enviado' && order.delivered) {
    order.status = 'Entregado';
  }
  if (previousStatus !== order.status) {
    await order.save();
  }
};

// Crear un nuevo pedido
exports.createOrder = async (req, res) => {
  let session;
  let userId;
  let idempotencyKey = '';
  try {
    if (req.user?.role !== 'user') {
      return res.status(403).json({ message: 'Solo las cuentas de cliente pueden crear pedidos.' });
    }
    userId = req.user._id;
    const rawIdempotencyKey = req.get?.('Idempotency-Key');
    idempotencyKey = typeof rawIdempotencyKey === 'string' ? rawIdempotencyKey.trim() : '';
    if (idempotencyKey && !/^[A-Za-z0-9_-]{16,128}$/.test(idempotencyKey)) {
      return res.status(400).json({ message: 'La clave de solicitud no tiene un formato válido.' });
    }
    const payload = { ...(req.body || {}), userId: userId.toString() };

    // Validar los datos antes de abrir la transacción.
    const { error } = orderSchema.validate(payload);
    if (error) {
      return res.status(400).json({ message: 'Datos inválidos', errors: error.details.map(err => err.message) });
    }

    const { firstName, lastName, email, phone, address, paymentMethod, paymentPreference, deliveryDate, products } = payload;
    const isSimulatedPaymentMethod = ['Demostración', 'Bre-B (simulado)'].includes(paymentMethod);

    // Si la petición anterior llegó al servidor pero la respuesta se perdió, devuelve
    // el mismo pedido en lugar de volver a descontar existencias.
    if (idempotencyKey) {
      const existingOrder = await Order.findOne({ userId, idempotencyKey });
      if (existingOrder) {
        return res.status(200).json({ message: 'Esta solicitud ya había creado un pedido.', order: existingOrder });
      }
    }

    if (
      paymentMethod === 'Wompi' && (
        !hasSandboxWompiCredentials({
          publicKey: process.env.WOMPI_PUBLIC_KEY,
          integritySecret: process.env.WOMPI_INTEGRITY_SECRET,
          eventsSecret: process.env.WOMPI_EVENTS_SECRET
        }) ||
        !process.env.FRONTEND_URL ||
        !/^https:\/\//.test(process.env.FRONTEND_URL)
      )
    ) {
      return res.status(503).json({ message: 'Los pagos no están configurados por completo. El pedido no se ha creado.' });
    }

    // La reserva de inventario y la creación del pedido se confirman juntas.
    // Así no quedan unidades descontadas si falla el guardado del pedido.
    session = await mongoose.startSession();
    let createdOrder;
    let reusedExistingOrder = false;
    await session.withTransaction(async () => {
      if (idempotencyKey) {
        const existingOrder = await Order.findOne({ userId, idempotencyKey }).session(session);
        if (existingOrder) {
          createdOrder = existingOrder;
          reusedExistingOrder = true;
          return;
        }
      }

      await validateProducts(products, { session });
      const productIds = products.map(item => item.productId);
      const dbProducts = await Product.find({ _id: { $in: productIds } }).session(session);
      const productMap = new Map(dbProducts.map(product => [product._id.toString(), product]));
      const totalAmount = products.reduce((sum, item) => {
        const product = productMap.get(item.productId.toString());
        if (!product || !Number.isFinite(product.price) || product.price <= 0) {
          throw new Error('Producto o precio inválido');
        }
        return sum + product.price * item.quantity;
      }, 0);
      if (!Number.isSafeInteger(Math.round(totalAmount * 100))) {
        throw new Error('Importe inválido');
      }

      await reduceInventory(products, { session });

      // Guardar deliveryDate a medianoche de Colombia sin desplazar el día por UTC.
      const deliveryDateColombia = moment.tz(deliveryDate, 'YYYY-MM-DD', 'America/Bogota').toDate();
      createdOrder = new Order({
        firstName, lastName, email, phone, address, paymentMethod,
        ...(paymentMethod === 'Pago pendiente de coordinación' && paymentPreference ? { paymentPreference } : {}),
        deliveryDate: deliveryDateColombia,
        totalAmount,
        products,
        orderDate: new Date(),
        userId,
        paymentStatus: isSimulatedPaymentMethod ? 'SIMULATED' : 'PENDING',
        paymentConfirmed: isSimulatedPaymentMethod,
        status: isSimulatedPaymentMethod ? 'Procesando' : 'Pendiente',
        ...(idempotencyKey ? { idempotencyKey } : {})
      });
      await createdOrder.save({ session });
    });

    return res.status(reusedExistingOrder ? 200 : 201).json({
      message: reusedExistingOrder ? 'Esta solicitud ya había creado un pedido.' : 'Pedido realizado exitosamente',
      order: createdOrder
    });
  } catch (error) {
    // Dos solicitudes simultáneas con la misma clave pueden competir por el índice único.
    // En ese caso, recupera el pedido ganador en vez de crear un duplicado.
    if (error?.code === 11000 && idempotencyKey && userId) {
      try {
        const existingOrder = await Order.findOne({ userId, idempotencyKey });
        if (existingOrder) {
          return res.status(200).json({ message: 'Esta solicitud ya había creado un pedido.', order: existingOrder });
        }
        return res.status(409).json({
          message: 'La clave de solicitud ya está asociada a otro registro. Inicia una nueva solicitud de pedido.'
        });
      } catch (lookupError) {
        console.error('No se pudo recuperar la solicitud de pedido repetida:', lookupError.message);
      }
    }

    console.error('Error al crear pedido:', error.message);
    const stockConflict = /Stock insuficiente|Uno de los productos ya no está disponible/i.test(error.message || '');
    if (stockConflict) {
      return res.status(409).json({
        message: 'Uno o más productos ya no están disponibles o no tienen stock suficiente. Actualiza el catálogo e inténtalo de nuevo.'
      });
    }

    // Unexpected database/transaction errors must not look like client validation errors:
    // the client keeps the idempotency key and can safely retry an uncertain result.
    return res.status(500).json({
      message: 'No fue posible confirmar el pedido. Reintenta la misma solicitud; el sistema verificará si ya existe.'
    });
  } finally {
    if (session) {
      try {
        await session.endSession();
      } catch (endError) {
        console.error('No fue posible cerrar la sesión de la transacción:', endError.message);
      }
    }
  }
};

// Obtener todos los pedidos del usuario (para clientes)
exports.getOrdersByUserId = async (req, res) => {
  try {
    const userId = req.user._id;  // Identificador del usuario autenticado
    // Filtrar solo los pedidos que tengan el userId del usuario autenticado
    const orders = await Order.find({ userId: userId })
      .select('-manualPaymentReference -paymentReviewedBy -paymentReviewNote')
      .populate('products.productId');
    // Devolver el arreglo (vacío si no hay pedidos)
    res.status(200).json(orders);
  } catch (error) {
    console.error('Error al obtener los pedidos:', error.message);
    res.status(500).json({ message: 'Error al obtener los pedidos' });
  }
};

// Obtener todos los pedidos (solo admins)
exports.getOrders = async (req, res) => {
  try {
    const orders = await Order.find().populate('products.productId');
    res.status(200).json(orders);
  } catch (error) {
    console.error('Error al obtener todos los pedidos:', error.message);
    res.status(500).json({ message: 'Error al obtener los pedidos' });
  }
};

// Actualizar datos logísticos/de contacto de un pedido (solo admins).
// Los importes, productos, usuario y datos del pago nunca se aceptan desde req.body.
exports.updateOrder = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ message: 'Identificador de pedido inválido.' });
    }

    const allowedFields = ['firstName', 'lastName', 'email', 'phone', 'address', 'deliveryDate'];
    const body = req.body && typeof req.body === 'object' ? req.body : {};
    const updates = {};
    for (const field of allowedFields) {
      if (Object.prototype.hasOwnProperty.call(body, field)) updates[field] = body[field];
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ message: 'No hay campos editables válidos.' });
    }

    const updateSchema = Joi.object({
      firstName: Joi.string().trim().min(1).max(100),
      lastName: Joi.string().trim().min(1).max(100),
      email: Joi.string().trim().email().max(254),
      phone: Joi.string().trim().min(5).max(30),
      address: Joi.string().trim().min(1).max(300),
      deliveryDate: deliveryDateSchema.optional()
    }).min(1).unknown(false);

    const { error, value } = updateSchema.validate(updates, { abortEarly: false, stripUnknown: true });
    if (error) {
      return res.status(400).json({ message: 'Datos inválidos', errors: error.details.map(item => item.message) });
    }

    // Interpret YYYY-MM-DD as a Colombia calendar date, not midnight UTC.
    const normalizedValue = { ...value };
    if (typeof normalizedValue.deliveryDate === 'string') {
      normalizedValue.deliveryDate = moment.tz(normalizedValue.deliveryDate, 'YYYY-MM-DD', 'America/Bogota').toDate();
    }

    const updatedOrder = await Order.findByIdAndUpdate(id, { $set: normalizedValue }, {
      new: true,
      runValidators: true,
      context: 'query'
    });
    if (!updatedOrder) return res.status(404).json({ message: 'Pedido no encontrado' });

    return res.status(200).json({ message: 'Datos del pedido actualizados.', order: updatedOrder });
  } catch (error) {
    console.error('Error al actualizar el pedido:', error.message);
    return res.status(500).json({ message: 'Error al actualizar el pedido' });
  }
};

// Eliminar un pedido (solo admins)
exports.deleteOrder = async (req, res) => {
  let session;
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ message: 'Identificador de pedido inválido.' });
    }
    session = await mongoose.startSession();
    let outcome = 'not-found';

    // El borrado y la devolución de inventario deben ser atómicos para evitar
    // perder el pedido sin devolver unidades si falla una operación de MongoDB.
    await session.withTransaction(async () => {
      const order = await Order.findById(id).session(session);
      if (!order) {
        outcome = 'not-found';
        return;
      }

      // Conservar pedidos con referencias o historial de pago para auditoría.
      if (order.paymentReference || order.paymentStatus !== 'PENDING' || order.paymentConfirmed || order.status === 'Cancelado') {
        outcome = 'protected';
        return;
      }

      const deletedOrder = await Order.findOneAndDelete({
        _id: id,
        paymentStatus: 'PENDING',
        paymentConfirmed: false,
        paymentReference: { $exists: false },
        status: { $ne: 'Cancelado' }
      }, { session });

      if (!deletedOrder) {
        outcome = 'conflict';
        return;
      }

      await restoreInventory(deletedOrder.products, { session });
      outcome = 'deleted';
    });

    if (outcome === 'not-found') return res.status(404).json({ message: 'Pedido no encontrado' });
    if (outcome === 'protected') {
      return res.status(409).json({
        message: 'Este pedido tiene un estado de pago o historial que debe conservarse; no se puede eliminar.'
      });
    }
    if (outcome === 'conflict') {
      return res.status(409).json({ message: 'El pedido cambió mientras se procesaba. Actualiza la lista e inténtalo de nuevo.' });
    }
    return res.status(200).json({ message: 'Pedido eliminado exitosamente' });
  } catch (error) {
    console.error('Error al eliminar el pedido:', error.message);
    return res.status(500).json({ message: 'Error al eliminar el pedido' });
  } finally {
    if (session) await session.endSession();
  }
};

 
// La revisión de ElectroVibe Pay la ejecuta un administrador después de comprobar
// la operación en el canal receptor. Aprobar aquí no inicia ni mueve dinero.
exports.reviewManualPayment = async (req, res) => {
  let session;
  try {
    if (req.user?.role !== 'admin') {
      return res.status(403).json({ message: 'Solo el administrador puede revisar el pago.' });
    }

    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ message: 'Identificador de pedido inválido.' });
    }

    const reviewSchema = Joi.object({
      decision: Joi.string().valid('approve', 'reject').required(),
      reference: Joi.when('decision', {
        is: 'approve',
        then: Joi.string().trim().min(5).max(120).required(),
        otherwise: Joi.string().trim().max(120).allow('').optional()
      }),
      note: Joi.string().trim().min(5).max(500).required()
    }).unknown(false);
    const { error, value } = reviewSchema.validate(req.body || {}, { abortEarly: false });
    if (error) {
      return res.status(400).json({
        message: value?.decision === 'approve'
          ? 'Para aprobar, indica una referencia verificable y una nota de revisión.'
          : 'Indica si apruebas o rechazas la revisión y registra una nota.',
        errors: error.details.map(item => item.message)
      });
    }

    session = await mongoose.startSession();
    let outcome = 'not-found';
    let reviewedOrder = null;

    await session.withTransaction(async () => {
      outcome = 'not-found';
      reviewedOrder = null;
      const order = await Order.findById(id).session(session);
      if (!order) return;

      if (order.paymentMethod !== 'Pago pendiente de coordinación') {
        outcome = 'unsupported-method';
        return;
      }
      if (order.paymentStatus !== 'PENDING' || order.paymentConfirmed) {
        outcome = 'already-reviewed';
        return;
      }
      if (!['Pendiente', 'Procesando'].includes(order.status) || order.packed || order.delivered) {
        outcome = 'logistics-started';
        return;
      }

      const reviewedAt = new Date();
      const reviewedBy = String(req.user.email || req.user._id || req.user.id || 'Administrador');
      order.paymentReviewedAt = reviewedAt;
      order.paymentReviewedBy = reviewedBy;
      order.paymentReviewNote = value.note;
      order.manualPaymentReference = value.reference || undefined;

      if (value.decision === 'approve') {
        order.paymentStatus = 'APPROVED';
        order.paymentConfirmed = true;
        if (order.status === 'Pendiente') order.status = 'Procesando';
      } else {
        // Rechazar el abono cancela el pedido pendiente y libera las unidades reservadas.
        await restoreInventory(order.products, { session });
        order.paymentStatus = 'DECLINED';
        order.paymentConfirmed = false;
        order.status = 'Cancelado';
      }

      await order.save({ session });
      reviewedOrder = order;
      outcome = 'updated';
    });

    if (outcome === 'not-found') return res.status(404).json({ message: 'Pedido no encontrado.' });
    if (outcome === 'unsupported-method') {
      return res.status(409).json({ message: 'Este pedido no utiliza la revisión manual de ElectroVibe Pay.' });
    }
    if (outcome === 'already-reviewed') {
      return res.status(409).json({ message: 'Este pago ya tiene una decisión registrada y no se puede revisar de nuevo.' });
    }
    if (outcome === 'logistics-started') {
      return res.status(409).json({ message: 'No se puede revisar el pago después de iniciar el envío o la entrega.' });
    }

    return res.status(200).json({
      message: value.decision === 'approve'
        ? 'Pago verificado. El pedido pasó a preparación.'
        : 'Pago rechazado. El pedido se canceló y el inventario se liberó.',
      order: reviewedOrder
    });
  } catch (error) {
    console.error('Error en la revisión manual del pago:', error.message);
    return res.status(500).json({ message: 'No fue posible registrar la revisión del pago.' });
  } finally {
    if (session) await session.endSession();
  }
};

// Actualizar el estado del pedido automáticamente
exports.updateOrderStatusAutomatically = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ message: 'Identificador de pedido inválido.' });
    }
    const order = await Order.findById(id);
    if (!order) return res.status(404).json({ message: 'Pedido no encontrado' });

    const body = req.body && typeof req.body === 'object' ? req.body : {};
    if (Object.keys(body).length > 0) {
      const statusSchema = Joi.object({
        prepare: Joi.boolean().valid(true),
        packed: Joi.boolean().valid(true),
        delivered: Joi.boolean().valid(true)
      }).xor('prepare', 'packed', 'delivered').unknown(false);
      const { error, value } = statusSchema.validate(body);
      if (error) {
        return res.status(400).json({
          message: 'Indica si deseas iniciar la preparación, enviar o entregar el pedido.',
          errors: error.details.map(item => item.message)
        });
      }

      if (order.status === 'Cancelado') {
        return res.status(409).json({ message: 'No se puede avanzar un pedido cancelado.' });
      }

      const coordinated = order.paymentMethod === 'Pago pendiente de coordinación' && order.paymentStatus === 'PENDING' && !order.paymentConfirmed;
      if (value.prepare === true) {
        if (!order.paymentConfirmed || !['APPROVED', 'SIMULATED'].includes(order.paymentStatus) || order.status !== 'Pendiente' || order.packed) {
          return res.status(409).json({ message: 'Solo se puede iniciar preparación con un pago aprobado.' });
        }
        order.status = 'Procesando';
      } else if (value.packed === true) {
        if (!order.paymentConfirmed || !['APPROVED', 'SIMULATED'].includes(order.paymentStatus) || order.status !== 'Procesando') {
          return res.status(409).json({ message: 'El pedido debe tener pago aprobado antes de preparar el envío.' });
        }
        order.packed = true;
        order.status = 'Enviado';
      } else {
        if (!order.packed || order.status !== 'Enviado') {
          return res.status(409).json({ message: 'El pedido debe estar preparado y enviado antes de marcarlo como entregado.' });
        }
        order.delivered = true;
        order.status = 'Entregado';
      }

      await order.save();
      return res.status(200).json({ message: 'Estado del pedido actualizado.', order });
    }

    // Compatibilidad con llamadas antiguas que solo solicitan evaluar las transiciones automáticas.
    const previousStatus = order.status;
    await updateOrderStatus(order);

    if (previousStatus === order.status) {
      return res.status(200).json({ message: 'El estado del pedido ya estaba actualizado', order });
    }

    return res.status(200).json({ message: 'Estado del pedido actualizado automáticamente', order });
  } catch (error) {
    console.error('Error al actualizar el estado del pedido:', error.message);
    return res.status(500).json({ message: 'Error al actualizar el estado del pedido' });
  }
};
