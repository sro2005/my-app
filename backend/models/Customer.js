const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const customerSchema = new mongoose.Schema({
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  birthDate: { type: Date, required: true },
  password: { type: String, required: true },
  address: { type: String, required: true },
  phone: { type: String, required: true },
  preferences: { type: [String], required: true },
  registrationDate: { type: Date, default: Date.now } // Añadido aquí
});

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

module.exports = mongoose.model('Customer', customerSchema);
