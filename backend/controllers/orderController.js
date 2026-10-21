const Order = require('../models/Order');
const { orderSchema } = require('../validations/orderValidation');
const Joi = require('joi');
const { validateProducts, reduceInventory, restoreInventory } = require('../utils/productUtils');
const Product = require('../models/Product');
const moment = require('moment-timezone'); // Importa moment-timezone

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
  let inventoryReduced = false;
  let reservedProducts = [];
  try {
    // Asegurarse de que userId esté en formato string
    const userId = req.user._id;
    // Convierte el userId a string
    req.body.userId = userId.toString();
    // Validar los datos del pedido
    const { error } = orderSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ message: 'Datos inválidos', errors: error.details.map(err => err.message) });
    }

    const { firstName, lastName, email, phone, address, paymentMethod, deliveryDate, products } = req.body;
    if (
      !process.env.WOMPI_PUBLIC_KEY ||
      !process.env.WOMPI_INTEGRITY_SECRET ||
      !process.env.WOMPI_EVENTS_SECRET ||
      !process.env.FRONTEND_URL ||
      !/^https:\/\//.test(process.env.FRONTEND_URL)
    ) {
      return res.status(503).json({ message: 'Los pagos no están configurados por completo. El pedido no se ha creado.' });
    }

    // El precio se calcula siempre en el servidor, nunca se confía en el total del navegador.
    await validateProducts(products);
    const productIds = products.map(item => item.productId);
    const dbProducts = await Product.find({ _id: { $in: productIds } });
    const productMap = new Map(dbProducts.map(product => [product._id.toString(), product]));
    const totalAmount = products.reduce((sum, item) => {
      const product = productMap.get(item.productId.toString());
      if (!product || !Number.isFinite(product.price) || product.price <= 0) throw new Error('Producto o precio inválido');
      return sum + product.price * item.quantity;
    }, 0);
    if (!Number.isSafeInteger(Math.round(totalAmount * 100))) throw new Error('Importe inválido');
    await reduceInventory(products);
    inventoryReduced = true;
    reservedProducts = products;

    // Convertir la fecha de entrega a la zona horaria de Colombia.
    // Se asume que deliveryDate viene en formato "YYYY-MM-DD".
    const deliveryDateColombia = moment.tz(deliveryDate, "YYYY-MM-DD", "America/Bogota").toDate();

    // Crear y guardar el nuevo pedido
    const newOrder = new Order({
      firstName, lastName, email, phone, address, paymentMethod, deliveryDate: deliveryDateColombia, totalAmount, products,
      orderDate: new Date(), // Registrar la fecha del pedido
      userId,  // Asignar el usuario que hizo el pedido
      paymentStatus: 'PENDING',
      paymentConfirmed: false
    });

    await newOrder.save();
    inventoryReduced = false;
    res.status(201).json({ message: 'Pedido realizado exitosamente', order: newOrder });
  } catch (error) {
    if (inventoryReduced) {
      try { await restoreInventory(reservedProducts); } catch (restoreError) { console.error('No se pudo revertir la reserva de inventario:', restoreError.message); }
    }
    console.error('Error al crear pedido:', error.message);
    res.status(400).json({ message: 'No fue posible crear el pedido. Verifica los datos e inténtalo nuevamente.' });
  }
};

// Obtener todos los pedidos del usuario (para clientes)
exports.getOrdersByUserId = async (req, res) => {
  try {
    const userId = req.user._id;  // Identificador del usuario autenticado
    // Filtrar solo los pedidos que tengan el userId del usuario autenticado
    const orders = await Order.find({ userId: userId }).populate('products.productId');
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
      deliveryDate: Joi.date().iso()
    }).min(1).unknown(false);

    const { error, value } = updateSchema.validate(updates, { abortEarly: false, stripUnknown: true });
    if (error) {
      return res.status(400).json({ message: 'Datos inválidos', errors: error.details.map(item => item.message) });
    }

    const updatedOrder = await Order.findByIdAndUpdate(id, { $set: value }, {
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
  try {
    const { id } = req.params;
    const order = await Order.findById(id);
    if (!order) return res.status(404).json({ message: 'Pedido no encontrado' });

    // Solo liberar stock si seguía reservado para un pedido sin pago.
    // Los pedidos cancelados ya liberaron inventario en el webhook; los aprobados lo consumieron.
    if (order.paymentStatus === 'PENDING' && order.status !== 'Cancelado' && !order.paymentConfirmed) {
      await restoreInventory(order.products);
    }
    await Order.findByIdAndDelete(id);
    
    res.status(200).json({ message: 'Pedido eliminado exitosamente' });
  } catch (error) {
    console.error('Error al eliminar el pedido:', error.message);
    res.status(500).json({ message: 'Error al eliminar el pedido' });
  }
};

// Actualizar el estado del pedido automáticamente
exports.updateOrderStatusAutomatically = async (req, res) => {
  try {
    const { id } = req.params;
    const order = await Order.findById(id);
    if (!order) return res.status(404).json({ message: 'Pedido no encontrado' });

    const previousStatus = order.status;
    await updateOrderStatus(order);

    if (previousStatus === order.status) {
      return res.status(200).json({ message: 'El estado del pedido ya estaba actualizado', order });
    }

    res.status(200).json({ message: 'Estado del pedido actualizado automáticamente', order });
  } catch (error) {
    console.error('Error al actualizar el estado del pedido:', error.message);
    res.status(500).json({ message: 'Error al actualizar el estado del pedido' });
  }
};