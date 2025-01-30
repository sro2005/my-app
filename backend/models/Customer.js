const mongoose = require('mongoose');

// Esquema de Cliente
const customerSchema = new mongoose.Schema({
  firstName: { type: String, required: true, trim: true },
  lastName: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true, match: [/^\S+@\S+\.\S+$/, 'Correo electrónico no válido'] },
  identificationNumber: { type: String, required: true, unique: true, match: [/^\d{10}$/, 'Número de identificación debe tener 10 dígitos'] },
  birthDate: { type: Date, required: true },
  password: { type: String, required: true },
  phone: { type: String, required: true },
  preferences: { type: [String], required: true },
  registrationDate: { type: Date, default: Date.now },
  role: { type: String, enum: ['user', 'admin'], default: 'user' }
});

const Customer = mongoose.model('Customer', customerSchema);

module.exports = Customer;

