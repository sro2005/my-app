const mongoose = require('mongoose');

const loginLogSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true },
  email: { type: String, required: true },
  loginTime: { type: Date, default: Date.now },
});

module.exports = mongoose.model('LoginLog', loginLogSchema);
