const mongoose = require('mongoose');
const Order = require('../models/Order');
const { orderSchema } = require('../validations/orderValidation');
const { validateProducts, reduceInventory, restoreInventory } = require('../utils/productUtils');

// Crear un nuevo pedido
exports.createOrder = async (req, res) => {
  try {
    const { error } = orderSchema.validate(req.body);
    if (error) {
      const errors = error.details.map(err => err.message);
      return res.status(400).json({ message: 'Datos inválidos', errors });
    }

    const { firstName, lastName, email, phone, address, paymentMethod, deliveryDate, totalAmount, products } = req.body;
    const userId = req.user?.id; // Se obtiene el ID del usuario autenticado

    await validateProducts(products);
    await reduceInventory(products);

    const newOrder = new Order({
      userId, // Asociamos el pedido con el usuario
      firstName,
      lastName,
      email,
      phone,
      address,
      paymentMethod,
      deliveryDate,
      totalAmount,
      products
    });

    await newOrder.save();
    res.status(201).json({ message: 'Pedido realizado exitosamente', order: newOrder });
  } catch (error) {
    res.status(400).json({ message: 'Error al crear el pedido', error: error.message });
  }
};

// Obtener todos los pedidos (solo admins)
exports.getOrders = async (req, res) => {
  try {
    const orders = await Order.find();
    res.status(200).json(orders);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Obtener pedidos de un usuario
exports.getUserOrders = async (req, res) => {
  const userId = req.user?.id;  // El ID del usuario proviene del token

  if (!userId) {
    return res.status(400).json({ message: 'ID de usuario no encontrado en el token' });
  }

  try {
    const orders = await Order.find({ userId: mongoose.Types.ObjectId(userId) });
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
      const errors = error.details.map(err => err.message);
      return res.status(400).json({ message: 'Datos inválidos', errors });
    }

    const { id } = req.params;

    const existingOrder = await Order.findById(id);
    if (!existingOrder) {
      return res.status(404).json({ message: 'Pedido no encontrado' });
    }

    // Restaurar inventario antes de actualizar
    await restoreInventory(existingOrder.products);

    const updatedOrder = await Order.findByIdAndUpdate(id, req.body, {
      new: true,
      runValidators: true
    });

    // Reducir inventario con los nuevos productos
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
    const order = await Order.findByIdAndDelete(id);

    if (!order) {
      return res.status(404).json({ message: 'Pedido no encontrado' });
    }

    // Restaurar inventario al eliminar un pedido
    await restoreInventory(order.products);

    res.status(200).json({ message: 'Pedido eliminado exitosamente' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};
