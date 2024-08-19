const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

// Expresiones regulares para validación
const emailRegex = /^[a-zA-Z0-9._%+-]+@(gmail\.com|outlook\.com)$/;
const phoneRegex = /^\+57\d{10}$/; // Código de país +57 seguido de 10 dígitos

// Definición del esquema para el modelo de cliente
const customerSchema = new mongoose.Schema({
  firstName: { type: String, required: true }, // Nombre del cliente
  lastName: { type: String, required: true }, // Apellido del cliente
  email: { 
    type: String, 
    required: true, 
    unique: true,
    match: [emailRegex, 'Por favor, ingresa un correo electrónico válido (Gmail o Outlook)'] // Validación de correo electrónico
  }, // Correo electrónico del cliente (único)
  identificationNumber: { type: String, required: true, unique: true }, // Número de identificación (único)
  birthDate: { type: Date, required: true }, // Fecha de nacimiento del cliente
  password: { type: String, required: true }, // Contraseña del cliente
  phone: { 
    type: String, 
    required: true, 
    match: [phoneRegex, 'Por favor, ingresa un número de teléfono válido con código +57'] // Validación de número de teléfono
  }, // Teléfono del cliente
  preferences: { type: [String], required: true }, // Preferencias del cliente
  registrationDate: { type: Date, default: Date.now }, // Fecha de registro automática
});

// Método estático para autenticar a un cliente
customerSchema.statics.authenticate = async function(email, password) {
  const customer = await this.findOne({ email });
  if (!customer) throw new Error('No such user found');
  const match = await bcrypt.compare(password, customer.password);
  if (!match) throw new Error('Incorrect password');
  return customer;
};

// Validación personalizada para asegurarse de que el cliente sea mayor de 18 años
customerSchema.pre('save', function(next) {
  // Obtener la fecha actual y la fecha de nacimiento del cliente
  const today = new Date();
  const birthDate = new Date(this.birthDate);
  let age = today.getFullYear() - birthDate.getFullYear(); // Calcular la edad

  const month = today.getMonth() - birthDate.getMonth();

  // Ajustar la edad si el cumpleaños no ha pasado aún este año
  if (month < 0 || (month === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }

  // Validar que la edad sea al menos 18 años
  if (age < 18) {
    return next(new Error('El cliente debe ser mayor de 18 años.'));
  }

  next();
});

module.exports = mongoose.model('Customer', customerSchema);
