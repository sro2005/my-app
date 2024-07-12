const Order = require('../models/Order');

// Crear un nuevo pedido
exports.createOrder = async (req, res) => {
  try {
    const { customerId, products, totalAmount } = req.body;

    const order = new Order({
      customerId,
      products,
      totalAmount
    });

    await order.save();
    res.status(201).json({ message: 'Pedido realizado exitosamente', order });
  } catch (error) {
    res.status(400).json({ message: "Cliente no encontrado" });
  }
};

// Obtener todos los pedidos
exports.getOrders = async (req, res) => {
  try {
    const orders = await Order.find().populate('customerId').populate('products');
    res.status(200).json(orders);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Actualizar un pedido
exports.updateOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const { customerId, products, totalAmount } = req.body;

    const order = await Order.findByIdAndUpdate(id, { customerId, products, totalAmount }, { new: true });

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
