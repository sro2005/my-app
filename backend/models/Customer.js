const mongoose = require('mongoose');

// Esquema de Cliente
const customerSchema = new mongoose.Schema({
  firstName: { type: String, required: true, trim: true },
  lastName: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true, match: [/^\S+@\S+\.\S+$/, 'Correo electrónico no válido'] },
  identificationNumber: { type: String, required: true, unique: true, match: [/^\d{1,3}(\.\d{3})*$/, 'Número de identificación no válido']  },
  birthDate: { type: Date, required: true },
  password: { type: String, required: true },
  phone: { type: String, required: true },
  preferences: { type: [String], required: true },
  registrationDate: { type: Date, default: Date.now },
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
  lastActivityDate: { type: Date, default: Date.now }, // Campo para la última actividad
  status: { type: String, default: 'Inactive', enum: ['Active', 'Inactive'] } // Campo para el estado del cliente
});

const Customer = mongoose.model('Customer', customerSchema);

module.exports = Customer;

