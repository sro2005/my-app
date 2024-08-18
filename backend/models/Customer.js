const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

// Definición del esquema para el modelo de cliente
const customerSchema = new mongoose.Schema({
  firstName: { type: String, required: true }, // Nombre del cliente
  lastName: { type: String, required: true }, // Apellido del cliente
  email: { type: String, required: true, unique: true }, // Correo electrónico del cliente (único)
  identificationNumber: { type: String, required: true, unique: true }, // Número de identificación (único)
  birthDate: { type: Date, required: true }, // Fecha de nacimiento del cliente
  password: { type: String, required: true }, // Contraseña del cliente
  phone: { type: String, required: true }, // Teléfono del cliente
  preferences: { type: [String], required: true }, // Preferencias del cliente
  registrationDate: { type: Date, default: Date.now }, // Fecha de registro automática
  role: { type: String, enum: ['cliente', 'admin'], default: 'cliente' } // Rol del cliente (cliente o admin)
});

// Método estático para autenticar a un cliente
customerSchema.statics.authenticate = async function(email, password) {
  // Buscar cliente por correo electrónico
  const customer = await this.findOne({ email });
  if (!customer) {
    throw new Error('Credenciales inválidas');
  }

  // Comparar la contraseña proporcionada con la contraseña almacenada
  const isMatch = await bcrypt.compare(password, customer.password);
  if (!isMatch) {
    throw new Error('Credenciales inválidas');
  }

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
