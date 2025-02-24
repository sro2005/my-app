const Joi = require('joi');

// Esquema de validación para el producto
exports.productSchema = Joi.object({
  name: Joi.string().required(),
  description: Joi.string().required(),
  category: Joi.string().required(),
  price: Joi.number().required(),
  quantity: Joi.number().required(),
  imageUrl: Joi.string().uri().required()
});