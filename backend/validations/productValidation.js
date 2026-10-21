const Joi = require('joi');

const productPrice = Joi.number().min(0.01).max(1000000000).custom((value, helpers) => {
  const cents = Math.round(value * 100);
  if (Math.abs(value * 100 - cents) > 1e-7) {
    return helpers.error('number.moneyPrecision');
  }
  return cents / 100;
}, 'price precision').messages({
  'number.moneyPrecision': 'El precio admite un máximo de dos decimales.'
});

const productImageUrl = Joi.string().trim().uri({ scheme: ['http', 'https'] }).custom((value, helpers) => {
  try {
    const imageUrl = new URL(value);
    if (!imageUrl.hostname || imageUrl.username || imageUrl.password || !/\.(?:jpe?g|gif|png)$/i.test(imageUrl.pathname)) {
      return helpers.error('string.imageUrl');
    }
  } catch {
    return helpers.error('string.imageUrl');
  }
  return value;
}, 'product image URL validation').messages({
  'string.imageUrl': 'La URL debe apuntar a una imagen JPG, JPEG, GIF o PNG.'
});

// Esquema de validación para el producto
exports.productSchema = Joi.object({
  name: Joi.string().trim().min(1).max(120).required(),
  description: Joi.string().trim().min(1).max(2000).required(),
  category: Joi.string().trim().min(1).max(80).required(),
  price: productPrice.required(),
  quantity: Joi.number().integer().min(0).max(1000000).required(),
  imageUrl: productImageUrl.required()
}).unknown(false);
