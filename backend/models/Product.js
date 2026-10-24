const mongoose = require('mongoose');

// Definición del esquema para el modelo de producto
const productSchema = new mongoose.Schema({
  name: { type: String, required: true, index: true }, // Nombre del producto con índice
  description: { type: String, required: true }, // Descripción del producto
  category: { type: String, required: true, index: true }, // Categoría del producto con índice
  price: { type: Number, required: true, min: 0.01, max: 1000000000 }, // Precio positivo con límite para evitar importes fuera de rango
  quantity: { type: Number, required: true, min: 0 }, // Cantidad disponible en inventario, asegurando que sea al menos 0
  imageUrl: { type: String, default: '', validate: { validator: value => value === '' || /^https?:\/\/[^/\s?#]+\/[^\s?#]*\.(?:jpe?g|gif|png|webp|avif)(?:\?[^\s#]*)?(?:#[^\s]*)?$/i.test(value) || /^\/images\/products\/[a-z0-9-]+\.svg$/i.test(value), message: 'La imagen debe ser una URL válida o una ruta local segura.' } },
  demo: { type: Boolean, default: false },
  demoIcon: { type: String, default: '' },
  catalogVersion: { type: String, default: '' }
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
