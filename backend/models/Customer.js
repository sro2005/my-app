const mongoose = require('mongoose');


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



const Customer = mongoose.model('Customer', customerSchema); 
module.exports = Customer;

