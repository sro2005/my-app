const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

// Esquema de Cliente
const customerSchema = new mongoose.Schema({
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  identificationNumber: { type: String, required: true, unique: true },
  birthDate: { type: Date, required: true },
  password: { type: String, required: true },
  phone: { type: String, required: true },
  preferences: { type: [String], required: true },
  registrationDate: { type: Date, default: Date.now },
  role: { type: String, enum: ['user', 'admin'], default: 'user' } // Añadido el campo role
});

// Método para encriptar la contraseña antes de guardar
customerSchema.pre('save', async function(next) {
  const customer = this;
  if (!customer.isModified('password')) return next();
  
  try {
    const hashedPassword = await bcrypt.hash(customer.password, 10);
    customer.password = hashedPassword;
    next();
  } catch (error) {
    next(error);
  }
});

const Customer = mongoose.model('Customer', customerSchema);

module.exports = Customer;

