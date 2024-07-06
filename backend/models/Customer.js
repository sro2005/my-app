const mongoose = require('mongoose');

const customerSchema = new mongoose.Schema({
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    birthDate: { type: Date, required: true },
    address: String,
    phone: String,
    productPreferences: [String]
});

module.exports = mongoose.model('Customer', customerSchema);
