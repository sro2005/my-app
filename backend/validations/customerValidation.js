const Joi = require('joi');

// Esquema de validación para el registro de cliente
exports.registerSchema = Joi.object({
  firstName: Joi.string().required(),
  lastName: Joi.string().required(),
  email: Joi.string().email().required(),
  identificationNumber: Joi.string().required(),
  birthDate: Joi.date().required(),
  password: Joi.string().min(6).required(),
  confirmPassword: Joi.string().required().valid(Joi.ref('password')).messages({'any.only': 'Passwords do not match'}),
  phone: Joi.string().required(),
  preferences: Joi.array().items(Joi.string()),
  role: Joi.string().valid('user', 'admin').default('user')
});

// Esquema de validación para el inicio de sesión
exports.loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required()
});
