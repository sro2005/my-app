const Joi = require('joi');
const moment = require('moment-timezone');

const deliveryDateSchema = Joi.string()
  .pattern(/^\d{4}-\d{2}-\d{2}$/)
  .custom((value, helpers) => {
    // Tratar la fecha como fecha de calendario (YYYY-MM-DD), no como instante UTC.
    // Joi.date() convierte la cadena a medianoche UTC y puede interpretarla como
    // el día anterior en America/Bogota.
    if (!moment(value, 'YYYY-MM-DD', true).isValid()) {
      return helpers.error('any.invalid');
    }
    const todayInBogota = moment.tz('America/Bogota').format('YYYY-MM-DD');
    if (value < todayInBogota) {
      return helpers.error('any.invalid');
    }
    return value;
  }, 'validación de fecha de entrega')
  .required()
  .messages({
    'string.pattern.base': 'La fecha de entrega debe tener formato YYYY-MM-DD.',
    'any.invalid': 'La fecha de entrega debe ser hoy o una fecha futura en Colombia.'
  });

// Esquema de validación para el pedido.
exports.deliveryDateSchema = deliveryDateSchema;

exports.orderSchema = Joi.object({
  firstName: Joi.string().trim().min(1).max(100).required(),
  lastName: Joi.string().trim().min(1).max(100).required(),
  email: Joi.string().trim().email().max(254).required(),
  phone: Joi.string().trim().min(7).max(30).required(),
  address: Joi.string().trim().min(1).max(300).required(),
  paymentMethod: Joi.string().valid('Pago pendiente de coordinación').required(),
  deliveryDate: deliveryDateSchema,
  // El total del navegador se acepta por compatibilidad, pero el controlador lo ignora
  // y calcula el importe con los precios almacenados en el servidor.
  totalAmount: Joi.any().optional(),
  products: Joi.array().items(
    Joi.object({
      productId: Joi.string().hex().length(24).required(),
      quantity: Joi.number().integer().min(1).max(1000000).required()
    }).unknown(false)
  ).min(1).max(100).required(),
  userId: Joi.string().hex().length(24).required()
}).unknown(false);
