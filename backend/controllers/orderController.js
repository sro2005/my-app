const Order = require('../models/Order');

// Crear un nuevo pedido
exports.createOrder = async (req, res) => {
  try {
    const { firstName, lastName, email, phone, address, paymentMethod, deliveryDate, totalAmount, products } = req.body;

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

// Obtener todos los pedidos
exports.getOrders = async (req, res) => {
  try {
    const orders = await Order.find();
    res.status(200).json(orders);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Actualizar un pedido
exports.updateOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const { firstName, lastName, email, phone, address, paymentMethod, deliveryDate, totalAmount, products } = req.body;

    const order = await Order.findByIdAndUpdate(id, {
      firstName,
      lastName,
      email,
      phone,
      address,
      paymentMethod,
      deliveryDate,
      totalAmount,
      products
    }, { new: true });

    if (!order) {
      return res.status(404).json({ message: 'Pedido no encontrado' });
    }

    res.status(200).json({ message: 'Pedido actualizado exitosamente', order });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Eliminar un pedido
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
