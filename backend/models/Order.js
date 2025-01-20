const mongoose = require('mongoose');

// Esquema anidado para productos en el pedido
const productSchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'Product' },
  quantity: { type: Number, required: true }
});

// Definición del esquema del pedido
const orderSchema = new mongoose.Schema({
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  email: { type: String, required: true, match: /\S+@\S+\.\S+/ },
  phone: { type: String, required: true, match: /^[0-9]{10}$/ },
  address: { type: String, required: true },
  paymentMethod: { type: String, required: true, enum: ['Credit Card', 'Debit Card', 'Cash', 'PayPal'] },
  deliveryDate: { type: Date, required: true },
  totalAmount: { type: Number, required: true },
  products: { type: [productSchema], required: true }
});

module.exports = mongoose.model('Order', orderSchema);
