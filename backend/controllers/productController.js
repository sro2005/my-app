const Product = require('../models/Product');
const { productSchema } = require('../validations/productValidation');

// Crear un nuevo producto (solo admins)
exports.createProduct = async (req, res) => {
  try {
    // Validar datos de entrada
    const { error } = productSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ message: 'Datos inválidos', error: error.details[0].message });
    }

    const { name, description, category, price, quantity, imageUrl } = req.body;

    // Crear una nueva instancia del modelo Product
    const newProduct = new Product({ name, description, category, price, quantity, imageUrl });

    // Guardar el nuevo producto en la base de datos
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

// Actualizar un producto (solo admins)
exports.updateProduct = async (req, res) => {
  try {
    // Validar datos de entrada
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
    res.status400.json({ error: error.message });
  }
};
