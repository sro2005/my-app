const Order = require('../models/Order');
const { orderSchema } = require('../validations/orderValidation');
const { validateProducts, reduceInventory, restoreInventory } = require('../utils/productUtils');

// Función para actualizar el estado del pedido automáticamente
const updateOrderStatus = async (order) => {
  if (order.status === 'Pendiente' && order.paymentConfirmed) {
    order.status = 'Procesando';
  } else if (order.status === 'Procesando' && order.packed) {
    order.status = 'Enviado';
  } else if (order.status === 'Enviado' && order.delivered) {
    order.status = 'Entregado';
  }
  await order.save();
};

// Crear un nuevo pedido
exports.createOrder = async (req, res) => {
  try {
    const { error } = orderSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ message: 'Datos inválidos', errors: error.details.map(err => err.message) });
    }

    const { firstName, lastName, email, phone, address, paymentMethod, deliveryDate, totalAmount, products } = req.body;
    const userId = req.user._id;  // Obtener el ID del usuario autenticado

    await validateProducts(products);
    await reduceInventory(products);

    const newOrder = new Order({
      firstName, lastName, email, phone, address, paymentMethod, deliveryDate, totalAmount, products,
      orderDate: new Date(), // Registrar la fecha del pedido
      userId: userId  // Asignar el usuario que hizo el pedido
    });

    await newOrder.save();
    res.status(201).json({ message: 'Pedido realizado exitosamente', order: newOrder });
  } catch (error) {
    res.status(400).json({ message: 'Error al crear el pedido', error: error.message });
  }
};

// Obtener un pedido específico por ID
exports.getOrderById = async (req, res) => {
  try {
    const { orderId } = req.params;
    const userId = req.user._id;  // Obtener el ID del usuario desde el token decodificado
    const isAdmin = req.user.role === 'admin';  // Comprobar si el usuario es admin

    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({ message: 'Pedido no encontrado' });
    }

    // Verificar que el usuario que solicita el pedido sea el propietario o un administrador
    if (order.userId.toString() !== userId && !isAdmin) {
      return res.status(403).json({ message: 'No tienes permisos para ver este pedido' });
    }

    res.status(200).json(order);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener el pedido', error: error.message });
  }
};

// Obtener todos los pedidos (solo admins)
exports.getOrders = async (req, res) => {
  try {
    res.status(200).json(await Order.find());
  } catch (error) {
    res.status(400).json({ error: error.message });
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

    await restoreInventory(existingOrder.products);
    const updatedOrder = await Order.findByIdAndUpdate(id, req.body, { new: true, runValidators: true });
    await reduceInventory(req.body.products);

    res.status(200).json({ message: 'Pedido actualizado exitosamente', order: updatedOrder });
  } catch (error) {
    res.status(400).json({ error: error.message });
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
    res.status(400).json({ error: error.message });
  }
};

// Actualizar el estado del pedido automáticamente
exports.updateOrderStatusAutomatically = async (req, res) => {
  const { id } = req.params;
  try {
    const order = await Order.findById(id);
    if (!order) return res.status(404).json({ message: 'Pedido no encontrado' });

    await updateOrderStatus(order);
    res.status(200).json({ message: 'Estado del pedido actualizado automáticamente', order });
  } catch (error) {
    res.status(400).json({ message: 'Error al actualizar el estado del pedido automáticamente', error: error.message });
  }
};