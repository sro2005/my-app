const mongoose = require('mongoose');
const bcrypt = require('bcrypt'); // Importa bcrypt para el middleware de encriptación

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

// Middleware para encriptar contraseñas antes de guardar
customerSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    return next();
  }

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    console.error('Error cifrando la contraseña:', error);
    next(error);
  }
});

const Customer = mongoose.model('Customer', customerSchema); 
module.exports = Customer;

