const Order = require('../models/Order'); // Importa el modelo de Pedido

// Crear un nuevo pedido
exports.createOrder = async (req, res) => {
  try {
    const { firstName, lastName, email, phone, address, paymentMethod, deliveryDate, totalAmount, products } = req.body;

    // Validaciones básicas
    if (!firstName || !lastName || !email || !phone || !address || !paymentMethod || !deliveryDate || !totalAmount || !products) {
      return res.status(400).json({ message: 'Todos los campos son obligatorios' });
    }

    // Validación simple de email (solo gmail y outlook)
    const emailRegex = /^[^\s@]+@(gmail\.com|outlook\.com)$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: 'Email debe ser de tipo @gmail.com o @outlook.com' });
    }

    // Validación simple de número de teléfono (formato +57 y 10 dígitos)
    const phoneRegex = /^\+57\d{10}$/;
    if (!phoneRegex.test(phone)) {
      return res.status(400).json({ message: 'Número de teléfono inválido. Debe estar en formato +57 seguido de 10 dígitos' });
    }

    // Crea una nueva instancia del modelo Order
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

    // Guarda el nuevo pedido en la base de datos
    await newOrder.save();
    res.status(201).json({ message: 'Pedido realizado exitosamente', order: newOrder });
  } catch (error) {
    res.status(400).json({ message: 'Error al crear el pedido', error: error.message });
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

    // Validaciones básicas
    if (!firstName || !lastName || !email || !phone || !address || !paymentMethod || !deliveryDate || !totalAmount || !products) {
      return res.status(400).json({ message: 'Todos los campos son obligatorios' });
    }

    // Validación simple de email (solo gmail y outlook)
    const emailRegex = /^[^\s@]+@(gmail\.com|outlook\.com)$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: 'Email debe ser de tipo @gmail.com o @outlook.com' });
    }

    // Validación simple de número de teléfono (formato +57 y 10 dígitos)
    const phoneRegex = /^\+57\d{10}$/;
    if (!phoneRegex.test(phone)) {
      return res.status(400).json({ message: 'Número de teléfono inválido. Debe estar en formato +57 seguido de 10 dígitos' });
    }

    // Actualiza el pedido en la base de datos
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
    }, { new: true });

    if (!updatedOrder) {
      return res.status(404).json({ message: 'Pedido no encontrado' });
    }

    res.status(200).json({ message: 'Pedido actualizado exitosamente', order: updatedOrder });
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

