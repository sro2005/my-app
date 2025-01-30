const Joi = require('joi');

// Esquema de validación para el pedido
exports.orderSchema = Joi.object({
  firstName: Joi.string().min(1).required(), // Asegura que el nombre no esté vacío
  lastName: Joi.string().min(1).required(), // Asegura que el apellido no esté vacío
  email: Joi.string().email().required(), // Validación del formato de correo
  phone: Joi.string().required().messages({ 'string.empty': 'Phone number is required' }),
  address: Joi.string().min(1).required(), // Asegura que la dirección no esté vacía
  paymentMethod: Joi.string().valid('Tarjeta de Crédito', 'Tarjeta de Débito', 'Nequi', 'Daviplata', 'Transfiya').required(),
  deliveryDate: Joi.date().required(), // Asegura que la fecha de entrega sea futura
  totalAmount: Joi.number().positive().greater(0).required(), // Validación para un monto positivo y mayor a cero
  products: Joi.array().items(Joi.object({
    productId: Joi.string().pattern(/^[0-9a-fA-F]{24}$/).required(), // Validación para ID de MongoDB
    quantity: Joi.number().min(1).required() // Asegura que la cantidad mínima sea 1
  })).min(1).required() // Asegura que haya al menos un producto
});
