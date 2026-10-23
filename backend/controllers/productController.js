const Product = require('../models/Product');
const Customer = require('../models/Customer');
const Order = require('../models/Order');
const { productSchema } = require('../validations/productValidation');

// Campos aceptados por la validación del servidor; los datos demo se conservan cuando se editan productos.
const productFields = (value) => {
  const fields = {
    name: value.name,
    description: value.description,
    category: value.category,
    price: value.price,
    quantity: value.quantity,
    imageUrl: value.imageUrl
  };
  for (const key of ['demo', 'demoIcon', 'catalogVersion']) {
    if (Object.prototype.hasOwnProperty.call(value, key)) fields[key] = value[key];
  }
  return fields;
};

// Crear un nuevo producto (solo admins)
exports.createProduct = async (req, res) => {
  try {
    const { error, value } = productSchema.validate(req.body, { abortEarly: false, stripUnknown: false });
    if (error) {
      return res.status(400).json({ message: 'Datos inválidos', errors: error.details.map(detail => detail.message) });
    }

    const newProduct = new Product(productFields(value));
    await newProduct.save();

    res.status(201).json({ message: 'Producto agregado exitosamente', product: newProduct });
  } catch (error) {
    console.error('Error al agregar producto:', error.message);
    res.status(500).json({ message: 'No fue posible agregar el producto.' });
  }
};

// Obtener todos los productos
exports.getProducts = async (req, res) => {
  try {
    const products = await Product.find();
    res.status(200).json(products);
  } catch (error) {
    console.error('Error al obtener productos:', error.message);
    res.status(500).json({ message: 'No fue posible obtener los productos.' });
  }
};

// Obtener productos según preferencias del usuario (para clientes)
// Ajuste: Consultamos el cliente en la base de datos para obtener las preferencias actualizadas
exports.getProductsByPreferences = async (req, res) => {
  try {
    const customer = await Customer.findById(req.user._id);
    if (!customer) {
      return res.status(404).json({ message: 'Cliente no encontrado' });
    }

    const preferences = customer.preferences;
    if (!preferences || preferences.length === 0) {
      return res.status(200).json([]);
    }

    const products = await Product.find({ category: { $in: preferences } });
    res.status(200).json(products);
  } catch (error) {
    console.error('Error al filtrar productos:', error.message);
    res.status(500).json({ message: 'No fue posible obtener los productos filtrados.' });
  }
};

// Actualizar un producto (solo admins)
exports.updateProduct = async (req, res) => {
  try {
    const { error, value } = productSchema.validate(req.body, { abortEarly: false, stripUnknown: false });
    if (error) {
      return res.status(400).json({ message: 'Datos inválidos', errors: error.details.map(detail => detail.message) });
    }

    const { id } = req.params;
    if (!Product.base.isValidObjectId(id)) {
      return res.status(400).json({ message: 'Identificador de producto inválido.' });
    }

    const updatedProduct = await Product.findByIdAndUpdate(id, {
      $set: productFields(value)
    }, { new: true, runValidators: true });

    if (!updatedProduct) return res.status(404).json({ message: 'Producto no encontrado' });
    res.status(200).json({ message: 'Producto actualizado exitosamente', product: updatedProduct });
  } catch (error) {
    console.error('Error actualizando producto:', error.message);
    res.status(500).json({ message: 'No fue posible actualizar el producto.' });
  }
};

// Eliminar un producto (solo admins)
exports.deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;
    if (!Product.base.isValidObjectId(id)) {
      return res.status(400).json({ message: 'Identificador de producto inválido.' });
    }

    // Mantener la integridad del historial: no eliminar productos que aparecen
    // en pedidos existentes, incluso si el pedido ya está completado.
    const referencedOrders = await Order.exists({ 'products.productId': id });
    if (referencedOrders) {
      return res.status(409).json({
        message: 'No se puede eliminar este producto porque está asociado a pedidos existentes.'
      });
    }

    const product = await Product.findByIdAndDelete(id);
    if (!product) return res.status(404).json({ message: 'Producto no encontrado' });
    return res.status(200).json({ message: 'Producto eliminado exitosamente' });
  } catch (error) {
    console.error('Error eliminando producto:', error.message);
    res.status(500).json({ message: 'No fue posible eliminar el producto.' });
  }
};
