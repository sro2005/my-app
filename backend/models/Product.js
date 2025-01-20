const mongoose = require('mongoose');

// Definición del esquema para el modelo de producto
const productSchema = new mongoose.Schema({
  name: { type: String, required: true, index: true }, // Nombre del producto con índice
  description: { type: String, required: true }, // Descripción del producto
  category: { type: String, required: true, index: true }, // Categoría del producto con índice
  price: { type: Number, required: true }, // Precio del producto
  quantity: { type: Number, required: true }, // Cantidad disponible en inventario
  imageUrl: { type: String, required: true, match: /^https?:\/\/.*\.(jpeg|jpg|gif|png)$/ } // Validación de URL de imagen
}, {
  timestamps: true // Agregar createdAt y updatedAt automáticamente
});

module.exports = mongoose.model('Product', productSchema);

