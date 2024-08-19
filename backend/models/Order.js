const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String, required: true },
  address: { type: String, required: true },
  paymentMethod: { type: String, required: true },
  deliveryDate: { type: Date, required: true },
  totalAmount: { type: Number, required: true },
  products: [{ type: mongoose.Schema.Types.Mixed, required: true }]
});

module.exports = mongoose.model('Order', orderSchema);