const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
    customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true },
    products: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true }],
    orderDate: { type: Date, default: Date.now },
    paymentMethod: { type: String, required: true },
    deliveryDate: { type: Date, required: true },
    status: { type: String, default: 'Pending' }
});

module.exports = mongoose.model('Order', orderSchema);
