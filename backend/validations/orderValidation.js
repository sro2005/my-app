const Joi = require('joi');
const moment = require('moment-timezone');

// Esquema de validación para el pedido
exports.orderSchema = Joi.object({
  firstName: Joi.string().min(1).required(), // Asegura que el nombre no esté vacío
  lastName: Joi.string().min(1).required(), // Asegura que el apellido no esté vacío
  email: Joi.string().email().required(), // Validación del formato de correo
  phone: Joi.string().required().messages({ 'string.empty': 'Phone number is required' }),
  address: Joi.string().min(1).required(), // Asegura que la dirección no esté vacía
  paymentMethod: Joi.string().valid('Wompi').required(),
  deliveryDate: Joi.date().custom((value, helpers) => { const delivery = moment.tz(value, "America/Bogota").startOf('day'); const today = moment.tz("America/Bogota").startOf('day'); return delivery.isSameOrAfter(today) ? value : helpers.error("any.invalid"); }, 'Fecha Deseada' ).required(),
  totalAmount: Joi.any().optional(), // Se ignora para calcular el total con precios del servidor.
  products: Joi.array().items( Joi.object({ productId: Joi.string().hex().length(24).required(), // ID de producto válido
  quantity: Joi.number().integer().positive().min(1).required() })).min(1).required(), // Al menos un producto en el pedido 
  accountNumber: Joi.string().trim().min(1).optional(),
  bankName: Joi.string().optional().allow(''),
  sameRegisteredNumber: Joi.boolean().optional(), // Campo opcional
  userId: Joi.string().hex().length(24).required() // Validación de userId (debe ser un ObjectId de MongoDB)
});