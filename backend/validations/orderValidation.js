const Joi = require('joi');

// Esquema de validación para el pedido
exports.orderSchema = Joi.object({
  firstName: Joi.string().required(),
  lastName: Joi.string().required(),
  email: Joi.string().email().required(),
  phone: Joi.string().required(),
  address: Joi.string().required(),
  paymentMethod: Joi.string().required(),
  deliveryDate: Joi.date().required(),
  totalAmount: Joi.number().required(),
  products: Joi.array().items(Joi.object({
    productId: Joi.string().required(),
    quantity: Joi.number().required()
  })).required()
});
