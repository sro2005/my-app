const mongoose = require('mongoose');

const customerSchema = new mongoose.Schema({
  // Campos obligatorios solo para usuarios (role === 'user')
  firstName: { type: String, required: function() { return this.role === 'user'; }, trim: true },
  lastName: { type: String, required: function() { return this.role === 'user'; }, trim: true },
  identificationNumber: { type: String, required: function() { return this.role === 'user'; }, unique: function() { return this.role === 'user'; }, match: [/^\d{1,3}(\.\d{3})*$/, 'Número de identificación no válido'] },
  birthDate: { type: Date, required: function() { return this.role === 'user'; } },
  phone: { type: String, required: function() { return this.role === 'user'; } },
  preferences: { type: [String], required: function() { return this.role === 'user'; } },
  // Campos obligatorios para todos los usuarios
  email: { type: String, required: true, unique: true, lowercase: true, trim: true, match: [/^\S+@\S+\.\S+$/, 'Correo electrónico no válido'] },
  password: { type: String, required: true },
  // Campos generales
  registrationDate: { type: Date, default: Date.now },
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
  lastActivityDate: { type: Date, default: Date.now },
  status: { type: String, default: 'Active', enum: ['Active', 'Inactive'] }
});

customerSchema.set('toJSON', {
  transform: (doc, ret) => {
    delete ret.password;
    delete ret.__v;
    // Si el rol es admin, eliminamos el campo 'preferences'
    if (ret.role === 'admin') {
      delete ret.preferences;
    }
    return ret;
  }
});

module.exports = mongoose.model('Customer', customerSchema);