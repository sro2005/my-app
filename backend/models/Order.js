const mongoose = require('mongoose');
const moment = require('moment-timezone');

// Definición del esquema del pedido
const orderSchema = new mongoose.Schema({
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  email: { type: String, required: true, match: /\S+@\S+\.\S+/ },
  phone: { type: String, required: true },
  address: { type: String, required: true },
  paymentMethod: { type: String, required: true },
  paymentPreference: { type: String, enum: ['Tarjeta', 'PSE', 'Billetera digital', 'Por definir'] },
  deliveryDate: { type: Date, required: true, validate: { validator: function(value) { return moment(value).tz("America/Bogota").startOf('day').isSameOrAfter(moment.tz("America/Bogota").startOf('day')); }, message: '"deliveryDate" must be today or in the future (Colombian time)' } },
  totalAmount: { type: Number, required: true, min: 0 },
  products: [{ productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true }, quantity: { type: Number, required: true } }],
  orderDate: { type: Date, default: Date.now }, 
  status: { type: String, default: 'Pendiente', enum: ['Pendiente', 'Procesando', 'Enviado', 'Entregado', 'Cancelado'] }, // Añadir estados posibles
  paymentConfirmed: { type: Boolean, default: false },
  paymentStatus: { type: String, enum: ['PENDING', 'APPROVED', 'DECLINED', 'ERROR', 'VOIDED', 'EXPIRED', 'SIMULATED'], default: 'PENDING' },
  paymentReference: { type: String, unique: true, sparse: true },
  idempotencyKey: { type: String, unique: true, sparse: true, select: false, immutable: true, match: /^[A-Za-z0-9_-]{16,128}$/ },
  paymentTransactionId: { type: String },
  // Revisión manual auditada por un administrador; no sustituye la verificación en el canal receptor.
  manualPaymentReference: { type: String, trim: true, maxlength: 120 },
  paymentReviewedAt: { type: Date },
  paymentReviewedBy: { type: String, trim: true, maxlength: 254 },
  paymentReviewNote: { type: String, trim: true, maxlength: 500 },
  // Última vez que se emitió el checkout: permite expirar sesiones abandonadas sin cortar una sesión recién abierta.
  checkoutStartedAt: { type: Date },
  packed: { type: Boolean, default: false },
  delivered: { type: Boolean, default: false },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true }, // Agregado para asociar al usuario
});

module.exports = mongoose.model('Order', orderSchema);