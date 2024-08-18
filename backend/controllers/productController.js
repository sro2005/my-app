const Product = require('../models/Product');

// Crear un nuevo producto
exports.createProduct = async (req, res) => {
  try {
    // Extraer la información del cuerpo de la solicitud
    const { name, description, category, price, quantity, imageUrl } = req.body;

    // Crear una nueva instancia del modelo Product con la información proporcionada
    const newProduct = new Product({
      name,
      description,
      category,
      price,
      quantity,
      imageUrl
    });

    // Guardar el nuevo producto en la base de datos
    await newProduct.save();

    // Enviar una respuesta exitosa con el producto creado
    res.status(201).json({ message: 'Producto agregado exitosamente', product: newProduct });
  } catch (error) {
    // Manejar errores y enviar una respuesta con el error
    res.status(400).json({ message: "Error al agregar el producto", error: error.message });
  }
};

// Obtener todos los productos
exports.getProducts = async (req, res) => {
  try {
    // Obtener todos los productos desde la base de datos
    const products = await Product.find();

    // Enviar una respuesta exitosa con la lista de productos
    res.status(200).json(products);
  } catch (error) {
    // Manejar errores y enviar una respuesta con el error
    res.status(400).json({ error: error.message });
  }
};

// Obtener un producto por su ID
exports.getProductById = async (req, res) => {
  try {
    // Extraer el id del producto desde la solicitud
    const { id } = req.params;

    // Buscar el producto por su ID en la base de datos
    const product = await Product.findById(id);

    // Verificar si el producto fue encontrado
    if (!product) {
      return res.status(404).json({ message: 'Producto no encontrado' });
    }

    // Enviar una respuesta exitosa con el producto encontrado
    res.status(200).json(product);
  } catch (error) {
    // Manejar errores y enviar una respuesta con el error
    res.status(400).json({ error: error.message });
  }
};

// Actualizar un producto
exports.updateProduct = async (req, res) => {
  try {
    // Extraer el id del producto y la información para actualizar desde la solicitud
    const { id } = req.params;
    const { name, description, category, price, quantity, imageUrl } = req.body;

    // Buscar y actualizar el producto en la base de datos
    const updatedProduct = await Product.findByIdAndUpdate(id, {
      name,
      description,
      category,
      price,
      quantity,
      imageUrl
    }, { new: true });

    // Verificar si el producto fue encontrado y actualizado
    if (!updatedProduct) {
      return res.status(404).json({ message: 'Producto no encontrado' });
    }

    // Enviar una respuesta exitosa con el producto actualizado
    res.status(200).json({ message: 'Producto actualizado exitosamente', product: updatedProduct });
  } catch (error) {
    // Manejar errores y enviar una respuesta con el error
    res.status(400).json({ error: error.message });
  }
};

// Eliminar un producto
exports.deleteProduct = async (req, res) => {
  try {
    // Extraer el id del producto desde la solicitud
    const { id } = req.params;

    // Buscar y eliminar el producto en la base de datos
    const product = await Product.findByIdAndDelete(id);

    // Verificar si el producto fue encontrado y eliminado
    if (!product) {
      return res.status(404).json({ message: 'Producto no encontrado' });
    }

    // Enviar una respuesta exitosa indicando que el producto fue eliminado
    res.status(200).json({ message: 'Producto eliminado exitosamente' });
  } catch (error) {
    // Manejar errores y enviar una respuesta con el error
    res.status(400).json({ error: error.message });
  }
};
