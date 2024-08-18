const mongoose = require('mongoose');

// Definición del esquema para el modelo de pedido
const orderSchema = new mongoose.Schema({
  firstName: { type: String, required: true }, // Nombre del cliente que realiza el pedido
  lastName: { type: String, required: true }, // Apellido del cliente que realiza el pedido
  email: { type: String, required: true }, // Correo electrónico del cliente
  phone: { type: String, required: true }, // Teléfono del cliente
  address: { type: String, required: true }, // Dirección de envío del pedido
  paymentMethod: { type: String, required: true }, // Método de pago utilizado para el pedido
  deliveryDate: { type: Date, required: true }, // Fecha de entrega solicitada para el pedido
  totalAmount: { type: Number, required: true }, // Monto total del pedido
  products: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }] // Referencia a los productos en el pedido
});

module.exports = mongoose.model('Order', orderSchema);
