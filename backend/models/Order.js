const mongoose = require('mongoose');

// Expresión regular para validar correos electrónicos de Gmail y Outlook
const emailRegex = /^[^\s@]+@(gmail\.com|outlook\.com)$/;

// Expresión regular para validar números de teléfono con código de país +57
const phoneRegex = /^\+57\d{10}$/; // Suponiendo que el número de teléfono tenga 10 dígitos después del código de país

// Definición del esquema para el modelo de pedido
const orderSchema = new mongoose.Schema({
  firstName: { type: String, required: true }, // Nombre del cliente que realiza el pedido
  lastName: { type: String, required: true }, // Apellido del cliente que realiza el pedido
  email: { 
    type: String, 
    required: true, 
    match: [emailRegex, 'Por favor, ingresa un correo electrónico válido de Gmail o Outlook'] // Validación del formato del correo electrónico
  },
  phone: { 
    type: String, 
    required: true, 
    match: [phoneRegex, 'Por favor, ingresa un número de teléfono válido con código +57'] // Validación del formato del número de teléfono
  },
  address: { type: String, required: true }, // Dirección de envío del pedido
  paymentMethod: { type: String, required: true }, // Método de pago utilizado para el pedido
  deliveryDate: { type: Date, required: true }, // Fecha de entrega solicitada para el pedido
  totalAmount: { type: Number, required: true }, // Monto total del pedido
  products: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }] // Referencia a los productos en el pedido
});

module.exports = mongoose.model('Order', orderSchema);
