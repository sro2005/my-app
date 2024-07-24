const Product = require('../models/Product');

// Crear un nuevo producto
exports.createProduct = async (req, res) => {
  try {
    const { name, description, category, price, quantity, imageUrl } = req.body;

    const product = new Product({
      name, 
      description, 
      category, 
      price, 
      quantity, 
      imageUrl
    });

    await product.save();
    res.status(201).json({ message: 'Producto agregado exitosamente', product });
  } catch (error) {
    res.status(400).json({ message: "El producto ya está registrado" });
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

// Actualizar un producto
exports.updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, price, category, stock } = req.body;

    const product = await Product.findByIdAndUpdate(id, { name, price, category, stock }, { new: true });

    if (!product) {
      return res.status(404).json({ message: 'Producto no encontrado' });
    }

    res.status(200).json({ message: 'Producto actualizado exitosamente', product });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Eliminar un producto
exports.deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;

    const product = await Product.findByIdAndDelete(id);

    if (!product) {
      return res.status(404).json({ message: 'Producto no encontrado' });
    }

    res.status(200).json({ message: 'Producto eliminado exitosamente' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};
