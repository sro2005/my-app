const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

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
  role: { type: String, enum: ['user', 'admin'], default: 'user' }
});

// Método para encriptar la contraseña antes de guardar
customerSchema.pre('save', async function(next) {
  const customer = this;

  // Si la contraseña no ha sido modificada, no hacemos nada
  if (!customer.isModified('password')) return next();

  console.log('Encriptando la contraseña...');

  try {
    const hashedPassword = await bcrypt.hash(customer.password, 10);
    customer.password = hashedPassword;
    next(); // Continúa el flujo
  } catch (error) {
    next(error); // Si hay un error, lo pasa al siguiente middleware de error
  }
});

// Verificación de email y número de identificación duplicado
customerSchema.statics.checkDuplicateEmailOrId = async function(email, identificationNumber) {
  const emailExists = await this.findOne({ email });
  const idExists = await this.findOne({ identificationNumber });
  if (emailExists || idExists) {
    throw new Error('El correo electrónico o número de identificación ya están registrados.');
  }
};

const Customer = mongoose.model('Customer', customerSchema);

module.exports = Customer;
