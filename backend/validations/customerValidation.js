const Joi = require('joi');
const { isColombianCalendarDate } = require('../utils/ageValidation');

const birthDateSchema = Joi.string()
  .pattern(/^\d{4}-\d{2}-\d{2}$/)
  .custom((value, helpers) => isColombianCalendarDate(value) ? value : helpers.error('any.invalid'))
  .required()
  .messages({
    'string.pattern.base': 'Birth date must use YYYY-MM-DD format.',
    'any.invalid': 'Birth date must be a real calendar date.'
  });

// Esquema de Validación para el Registro de Cliente / Administrador
exports.registerSchema = Joi.object({
  firstName: Joi.when('role', { is: 'user', then: Joi.string().required().messages({ 'string.empty': 'First name is required' }), otherwise: Joi.string().optional() }),
  lastName: Joi.when('role', { is: 'user', then: Joi.string().required().messages({ 'string.empty': 'Last name is required' }), otherwise: Joi.string().optional() }),
  email: Joi.string().email().required().messages({ 'string.empty': 'Email is required', 'string.email': 'Invalid email format' }),
  identificationNumber: Joi.when('role', { is: 'user', then: Joi.string().pattern(/^[0-9]{1,3}([.][0-9]{3})*$/).required().messages({ 'string.empty': 'Identification number is required', 'string.pattern.base': 'Identification number format is invalid' }), otherwise: Joi.string().optional() }),
  birthDate: Joi.when('role', { is: 'user', then: birthDateSchema, otherwise: Joi.string().optional() }),
  password: Joi.string().min(8).max(128).pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#\\$%\\^&\\*])')).required().messages({ 'string.empty': 'Password is required', 'string.min': 'Password must be at least 8 characters long', 'string.max': 'Password must be at most 128 characters long', 'string.pattern.base': 'Password must include uppercase, lowercase, number, and special character' }),
  phone: Joi.when('role', { is: 'user', then: Joi.string().required().messages({ 'string.empty': 'Phone number is required' }), otherwise: Joi.string().optional() }),
  preferences: Joi.when('role', { is: 'user', then: Joi.array().items(Joi.string()).messages({ 'array.includes': 'Preferences must be an array of strings' }), otherwise: Joi.array().optional() }),
  role: Joi.string().valid('user', 'admin').default('user')
});

// Esquema de validación para el inicio de sesión
exports.loginSchema = Joi.object({
  email: Joi.string().email().required().messages({ 'string.empty': 'Email is required', 'string.email': 'Invalid email format' }),
  password: Joi.string().min(8).max(128).pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#\\$%\\^&\\*])')).required().messages({ 'string.empty': 'Password is required', 'string.min': 'Password must be at least 8 characters long', 'string.max': 'Password must be at most 128 characters long', 'string.pattern.base': 'Password must include uppercase, lowercase, number, and special character' })
});