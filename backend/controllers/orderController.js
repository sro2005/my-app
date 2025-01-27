const Order = require('../models/Order');
const { orderSchema } = require('../validations/orderValidation');
const { validateProducts, reduceInventory } = require('../utils/productUtils');

// Crear un nuevo pedido
exports.createOrder = async (req, res) => {
  try {
    const { error } = orderSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ message: 'Datos inválidos', error: error.details[0].message });
    }

    const { firstName, lastName, email, phone, address, paymentMethod, deliveryDate, totalAmount, products } = req.body;

    await validateProducts(products);
    await reduceInventory(products);

    const newOrder = new Order({
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
    res.status(400).json({ message: "Error al crear el pedido", error: error.message });
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
  const { userId } = req.params;

  try {
    const orders = await Order.find({ userId });
    res.status(200).json(orders);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener los pedidos', error });
  }
};

// Actualizar un pedido (solo admins)
exports.updateOrder = async (req, res) => {
  try {
    const { error } = orderSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ message: 'Datos inválidos', error: error.details[0].message });
    }

    const { id } = req.params;
    const { firstName, lastName, email, phone, address, paymentMethod, deliveryDate, totalAmount, products } = req.body;

    const updatedOrder = await Order.findByIdAndUpdate(id, {
      firstName,
      lastName,
      email,
      phone,
      address,
      paymentMethod,
      deliveryDate,
      totalAmount,
      products
    }, { new: true, runValidators: true });

    if (!updatedOrder) {
      return res.status(404).json({ message: 'Pedido no encontrado' });
    }

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

    res.status(200).json({ message: 'Pedido eliminado exitosamente' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

