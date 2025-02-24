const Order = require('../models/Order');
const { orderSchema } = require('../validations/orderValidation');
const { validateProducts, reduceInventory, restoreInventory } = require('../utils/productUtils');
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
  try {
    // Asegurarse de que userId esté en formato string
    const userId = req.body.userId || req.user._id;
    // Convierte el userId a string
    req.body.userId = userId.toString();
    // Validar los datos del pedido
    const { error } = orderSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ message: 'Datos inválidos', errors: error.details.map(err => err.message) });
    }

    const { firstName, lastName, email, phone, address, paymentMethod, deliveryDate, totalAmount, products } = req.body;

    // Validar los productos y reducir el inventario
    await validateProducts(products);
    await reduceInventory(products);

    // Convertir la fecha de entrega a la zona horaria de Colombia.
    // Se asume que deliveryDate viene en formato "YYYY-MM-DD".
    const deliveryDateColombia = moment.tz(deliveryDate, "YYYY-MM-DD", "America/Bogota").toDate();

    // Crear y guardar el nuevo pedido
    const newOrder = new Order({
      firstName, lastName, email, phone, address, paymentMethod, deliveryDate: deliveryDateColombia, totalAmount, products,
      orderDate: new Date(), // Registrar la fecha del pedido
      userId  // Asignar el usuario que hizo el pedido
    });

    await newOrder.save();
    console.log('Pedido guardado:', newOrder);
    res.status(201).json({ message: 'Pedido realizado exitosamente', order: newOrder });
  } catch (error) {
    res.status(400).json({ message: 'Error al crear el pedido', error: error.message });
  }
};

// Obtener todos los pedidos del usuario (para clientes)
exports.getOrdersByUserId = async (req, res) => {
  try {
    const userId = req.user;  // Se obtiene del token
    // Filtrar solo los pedidos que tengan el userId del usuario autenticado
    const orders = await Order.find({ userId: userId }).populate('products.productId');
    // Devolver el arreglo (vacío si no hay pedidos)
    res.status(200).json(orders);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener los pedidos', error: error.message });
  }
};

// Obtener todos los pedidos (solo admins)
exports.getOrders = async (req, res) => {
  try {
    const orders = await Order.find().populate('products.productId');
    res.status(200).json(orders);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener los pedidos', error: error.message });
  }
};

// Actualizar un pedido (solo admins)
exports.updateOrder = async (req, res) => {
  try {
    const { error } = orderSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ message: 'Datos inválidos', errors: error.details.map(err => err.message) });
    }
    
    const { id } = req.params;
    const existingOrder = await Order.findById(id);
    if (!existingOrder) return res.status(404).json({ message: 'Pedido no encontrado' });

    // Si los productos han cambiado, restaurar el inventario del pedido anterior
    if (JSON.stringify(existingOrder.products) !== JSON.stringify(req.body.products)) {
      await restoreInventory(existingOrder.products);
      await reduceInventory(req.body.products);
    }

    const updatedOrder = await Order.findByIdAndUpdate(id, req.body, { new: true, runValidators: true });
    res.status(200).json({ message: 'Pedido actualizado exitosamente', order: updatedOrder });
  } catch (error) {
    res.status(500).json({ message: 'Error al actualizar el pedido', error: error.message });
  }
};

// Eliminar un pedido (solo admins)
exports.deleteOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const order = await Order.findById(id);
    if (!order) return res.status(404).json({ message: 'Pedido no encontrado' });

    await restoreInventory(order.products);
    await Order.findByIdAndDelete(id);
    
    res.status(200).json({ message: 'Pedido eliminado exitosamente' });
  } catch (error) {
    res.status(500).json({ message: 'Error al eliminar el pedido', error: error.message });
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
    res.status(500).json({ message: 'Error al actualizar el estado del pedido', error: error.message });
  }
};