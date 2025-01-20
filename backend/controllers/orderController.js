const Order = require('../models/Order');
const Product = require('../models/Product');
const Joi = require('joi'); // Importa Joi para la validación de datos

// Esquema de validación para el pedido
const orderSchema = Joi.object({
  firstName: Joi.string().required(),
  lastName: Joi.string().required(),
  email: Joi.string().email().required(),
  phone: Joi.string().required(),
  address: Joi.string().required(),
  paymentMethod: Joi.string().required(),
  deliveryDate: Joi.date().required(),
  totalAmount: Joi.number().required(),
  products: Joi.array().items(Joi.object({
    productId: Joi.string().required(),
    quantity: Joi.number().required()
  })).required()
});

// Función para validar los productos
const validateProducts = async (products) => {
  for (const item of products) {
    const product = await Product.findById(item.productId);
    if (!product) {
      throw new Error(`Producto con ID ${item.productId} no encontrado`);
    }
    if (product.quantity < item.quantity) {
      throw new Error(`El producto ${product.name} no tiene suficiente inventario`);
    }
  }
};

// Función para reducir inventario de productos
const reduceInventory = async (products) => {
  for (const item of products) {
    const product = await Product.findById(item.productId);
    product.quantity -= item.quantity;
    await product.save();
  }
};

// Crear un nuevo pedido
exports.createOrder = async (req, res) => {
  try {
    // Validar datos de entrada
    const { error } = orderSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ message: 'Datos inválidos', error: error.details[0].message });
    }

    const { firstName, lastName, email, phone, address, paymentMethod, deliveryDate, totalAmount, products } = req.body;

    // Validar los productos y reducir inventario
    await validateProducts(products);
    await reduceInventory(products);

    // Crear una nueva instancia del modelo Order
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
    // Validar datos de entrada
    const { error } = orderSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ message: 'Datos inválidos', error: error.details[0].message });
    }

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
    }, { new: true, runValidators: true });

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
