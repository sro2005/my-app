const mongoose = require('mongoose');

// Definición del esquema para el modelo de producto
const productSchema = new mongoose.Schema({
  name: { type: String, required: true }, // Nombre del producto
  description: { type: String, required: true }, // Descripción del producto
  category: { type: String, required: true }, // Categoría del producto
  price: { type: Number, required: true }, // Precio del producto
  quantity: { type: Number, required: true }, // Cantidad disponible en inventario
  imageUrl: { type: String, required: true } // URL de la imagen del producto
});

module.exports = mongoose.model('Product', productSchema);

