const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const customerSchema = new mongoose.Schema({
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  identificationNumber: { type: String, required: true, unique: true }, // Campo añadido
  birthDate: { type: Date, required: true },
  password: { type: String, required: true },
  phone: { type: String, required: true },
  preferences: { type: [String], required: true },
  registrationDate: { type: Date, default: Date.now } // Fecha de registro
});

// Método estático para autenticar a un cliente
customerSchema.statics.authenticate = async function(email, password) {
  const customer = await this.findOne({ email });
  if (!customer) {
    throw new Error('Credenciales inválidas');
  }

  const isMatch = await bcrypt.compare(password, customer.password);
  if (!isMatch) {
    throw new Error('Credenciales inválidas');
  }

  return customer;
};

// Validación personalizada para asegurarse de que el cliente sea mayor de 18 años
customerSchema.pre('save', function(next) {
  const today = new Date();
  const birthDate = new Date(this.birthDate);
  let age = today.getFullYear() - birthDate.getFullYear(); // Usar let para permitir la reasignación

  const month = today.getMonth() - birthDate.getMonth();

  // Ajuste de edad si el cumpleaños no ha pasado aún este año
  if (month < 0 || (month === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }

  if (age < 18) {
    return next(new Error('El cliente debe ser mayor de 18 años.'));
  }

  next();
});

module.exports = mongoose.model('Customer', customerSchema);