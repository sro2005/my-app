const Order = require('../models/Order');

// Crear un nuevo pedido
exports.createOrder = async (req, res) => {
  try {
    // Extraer la información del cuerpo de la solicitud
    const { firstName, lastName, email, phone, address, paymentMethod, deliveryDate, totalAmount, products } = req.body;

    // Crear una nueva instancia del modelo Order con la información proporcionada
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

    // Guardar el nuevo pedido en la base de datos
    await newOrder.save();

    // Enviar una respuesta exitosa con el pedido creado
    res.status(201).json({ message: 'Pedido realizado exitosamente', order: newOrder });
  } catch (error) {
    // Manejar errores y enviar una respuesta con el error
    res.status(400).json({ message: "Error al crear el pedido", error: error.message });
  }
};

// Obtener todos los pedidos
exports.getOrders = async (req, res) => {
  try {
    // Obtener todos los pedidos desde la base de datos
    const orders = await Order.find();

    // Enviar una respuesta exitosa con la lista de pedidos
    res.status(200).json(orders);
  } catch (error) {
    // Manejar errores y enviar una respuesta con el error
    res.status(400).json({ error: error.message });
  }
};

// Actualizar un pedido
exports.updateOrder = async (req, res) => {
  try {
    // Extraer el id del pedido y la información para actualizar desde la solicitud
    const { id } = req.params;
    const { firstName, lastName, email, phone, address, paymentMethod, deliveryDate, totalAmount, products } = req.body;

    // Buscar y actualizar el pedido en la base de datos
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

    // Verificar si el pedido fue encontrado y actualizado
    if (!updatedOrder) {
      return res.status(404).json({ message: 'Pedido no encontrado' });
    }

    // Enviar una respuesta exitosa con el pedido actualizado
    res.status(200).json({ message: 'Pedido actualizado exitosamente', order: updatedOrder });
  } catch (error) {
    // Manejar errores y enviar una respuesta con el error
    res.status(400).json({ error: error.message });
  }
};

// Eliminar un pedido
exports.deleteOrder = async (req, res) => {
  try {
    // Extraer el id del pedido desde la solicitud
    const { id } = req.params;

    // Buscar y eliminar el pedido en la base de datos
    const order = await Order.findByIdAndDelete(id);

    // Verificar si el pedido fue encontrado y eliminado
    if (!order) {
      return res.status(404).json({ message: 'Pedido no encontrado' });
    }

    // Enviar una respuesta exitosa indicando que el pedido fue eliminado
    res.status(200).json({ message: 'Pedido eliminado exitosamente' });
  } catch (error) {
    // Manejar errores y enviar una respuesta con el error
    res.status(400).json({ error: error.message });
  }
};