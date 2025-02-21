const Product = require('../models/Product');
const Customer = require('../models/Customer'); // Asegúrate de que la ruta y el modelo sean correctos
const { productSchema } = require('../validations/productValidation');

// Crear un nuevo producto (solo admins)
exports.createProduct = async (req, res) => {
  try {
    const { error } = productSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ message: 'Datos inválidos', error: error.details[0].message });
    }

    const { name, description, category, price, quantity, imageUrl } = req.body;
    const newProduct = new Product({ name, description, category, price, quantity, imageUrl });
    await newProduct.save();

    res.status(201).json({ message: 'Producto agregado exitosamente', product: newProduct });
  } catch (error) {
    res.status(400).json({ message: "Error al agregar el producto", error: error.message });
  }
};

// Obtener todos los productos
exports.getProducts = async (req, res) => {
  try {
    const products = await Product.find();
    res.status(200).json(products);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Obtener productos según preferencias del usuario (para clientes)
// Ajuste: Consultamos el cliente en la base de datos para obtener las preferencias actualizadas
exports.getProductsByPreferences = async (req, res) => {
  try {
    // Buscamos el cliente actualizado en la base de datos
    const customer = await Customer.findById(req.user._id);
    if (!customer) {
      return res.status(404).json({ message: 'Cliente no encontrado' });
    }
    
    const preferences = customer.preferences; // Ahora obtenemos las preferencias actualizadas desde la DB

    if (!preferences || preferences.length === 0) {
      return res.status(200).json([]); // O bien, podrías devolver todos los productos si lo prefieres
    }
    
    // Buscar productos cuya 'category' esté entre las preferencias actualizadas del usuario
    const products = await Product.find({ category: { $in: preferences } });
    res.status(200).json(products);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener los productos filtrados', error: error.message });
  }
};

// Actualizar un producto (solo admins)
exports.updateProduct = async (req, res) => {
  try {
    const { error } = productSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ message: 'Datos inválidos', error: error.details[0].message });
    }

    const { id } = req.params;
    const { name, description, category, price, quantity, imageUrl } = req.body;
    const updatedProduct = await Product.findByIdAndUpdate(id, {
      name, description, category, price, quantity, imageUrl
    }, { new: true, runValidators: true });

    if (!updatedProduct) return res.status(404).json({ message: 'Producto no encontrado' });
    res.status(200).json({ message: 'Producto actualizado exitosamente', product: updatedProduct });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Eliminar un producto (solo admins)
exports.deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const product = await Product.findByIdAndDelete(id);
    if (!product) return res.status(404).json({ message: 'Producto no encontrado' });
    res.status(200).json({ message: 'Producto eliminado exitosamente' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};