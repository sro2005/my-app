const mongoose = require('mongoose');

// Definición del esquema para el modelo de producto
const productSchema = new mongoose.Schema({
  name: { type: String, required: true, index: true }, // Nombre del producto con índice
  description: { type: String, required: true }, // Descripción del producto
  category: { type: String, required: true, index: true }, // Categoría del producto con índice
  price: { type: Number, required: true, min: 0 }, // Precio del producto, asegurando que sea al menos 0
  quantity: { type: Number, required: true, min: 0 }, // Cantidad disponible en inventario, asegurando que sea al menos 0
  imageUrl: { type: String, required: true, match: /^https?:\/\/.*\.(jpeg|jpg|gif|png)$/ } // Validación de URL de imagen
}, {
  timestamps: true // Agregar createdAt y updatedAt automáticamente
});

// Pre-hook para validar datos antes de guardar
productSchema.pre('save', function(next) {
  if (this.price < 0) {
    return next(new Error('El precio no puede ser negativo'));
  }
  if (this.quantity < 0) {
    return next(new Error('La cantidad no puede ser negativa'));
  }
  next();
});

module.exports = mongoose.model('Product', productSchema);