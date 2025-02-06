const mongoose = require('mongoose');

// Definición del esquema del pedido
const orderSchema = new mongoose.Schema({
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  email: { type: String, required: true, match: /\S+@\S+\.\S+/ },
  phone: { type: String, required: true },
  address: { type: String, required: true },
  paymentMethod: { type: String, required: true },
  deliveryDate: { type: Date, required: true },
  totalAmount: { type: Number, required: true, min: 0 },
  products: [{ productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true }, quantity: { type: Number, required: true } }],
  orderDate: { type: Date, default: Date.now }, // Campo para la fecha del pedido
  status: { type: String, default: 'Pendiente', enum: ['Pendiente', 'Procesando', 'Enviado', 'Entregado', 'Cancelado'] }, // Añadir estados posibles
  paymentConfirmed: { type: Boolean, default: false },
  packed: { type: Boolean, default: false },
  delivered: { type: Boolean, default: false },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true }, // Agregado para asociar al usuario
});

module.exports = mongoose.model('Order', orderSchema);



