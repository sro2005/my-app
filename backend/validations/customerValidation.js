const Joi = require('joi');

// Esquema de Validación para el Registro de Cliente / Administrador
exports.registerSchema = Joi.object({
  firstName: Joi.when('role', { is: 'user', then: Joi.string().required().messages({ 'string.empty': 'First name is required' }), otherwise: Joi.string().optional() }),
  lastName: Joi.when('role', { is: 'user', then: Joi.string().required().messages({ 'string.empty': 'Last name is required' }), otherwise: Joi.string().optional() }),
  email: Joi.string().email().required().messages({ 'string.empty': 'Email is required', 'string.email': 'Invalid email format' }),
  identificationNumber: Joi.when('role', { is: 'user', then: Joi.string().required().messages({ 'string.empty': 'Identification number is required' }), otherwise: Joi.string().optional() }),
  birthDate: Joi.when('role', { is: 'user', then: Joi.date().required().messages({ 'date.base': 'Invalid birth date', 'any.required': 'Birth date is required' }), otherwise: Joi.date().optional() }),
  password: Joi.string().min(8).pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#\\$%\\^&\\*])')).required().messages({ 'string.empty': 'Password is required', 'string.min': 'Password must be at least 8 characters long', 'string.pattern.base': 'Password must include uppercase, lowercase, number, and special character' }),
  phone: Joi.when('role', { is: 'user', then: Joi.string().required().messages({ 'string.empty': 'Phone number is required' }), otherwise: Joi.string().optional() }),
  preferences: Joi.when('role', { is: 'user', then: Joi.array().items(Joi.string()).messages({ 'array.includes': 'Preferences must be an array of strings' }), otherwise: Joi.array().optional() }),
  role: Joi.string().valid('user', 'admin').default('user')
});

// Esquema de validación para el inicio de sesión
exports.loginSchema = Joi.object({
  email: Joi.string().email().required().messages({ 'string.empty': 'Email is required', 'string.email': 'Invalid email format' }),
  password: Joi.string().min(8).pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#\\$%\\^&\\*])')).required().messages({ 'string.empty': 'Password is required', 'string.min': 'Password must be at least 8 characters long', 'string.pattern.base': 'Password must include uppercase, lowercase, number, and special character' })
});