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

const productImageUrl = Joi.string().trim().allow('').custom((value, helpers) => {
  if (value === '' || /^\/images\/products\/[a-z0-9-]+\.svg$/.test(value)) return value;
  try {
    const imageUrl = new URL(value);
    if (!imageUrl.hostname || imageUrl.username || imageUrl.password || !/^https?:$/.test(imageUrl.protocol) ||
        !/\.(?:jpe?g|gif|png|webp|avif)$/i.test(imageUrl.pathname)) {
      return helpers.error('string.imageUrl');
    }
  } catch {
    return helpers.error('string.imageUrl');
  }
  return value;
}, 'product image URL validation').messages({
  'string.imageUrl': 'Usa una URL de imagen válida o una imagen SVG local del catálogo de demostración.'
});

// Campos demo opcionales para que la administración no pierda las marcas del catálogo de muestra.
exports.productSchema = Joi.object({
  name: Joi.string().trim().min(1).max(120).required(),
  description: Joi.string().trim().min(1).max(2000).required(),
  category: Joi.string().trim().min(1).max(80).required(),
  price: productPrice.required(),
  quantity: Joi.number().integer().min(0).max(1000000).required(),
  imageUrl: productImageUrl.required(),
  demo: Joi.boolean().optional(),
  demoIcon: Joi.string().trim().max(8).optional(),
  catalogVersion: Joi.string().trim().max(80).optional()
}).unknown(false);
