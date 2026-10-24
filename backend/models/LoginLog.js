const mongoose = require('mongoose');

const loginLogSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true },
  email: { type: String, required: true },
  loginTime: { type: Date, default: Date.now },
});

const LoginLog = mongoose.model('LoginLog', loginLogSchema);

// Registra la actividad sin escribir correos, identificadores ni documentos completos en los logs del servidor.
async function registerOrUpdateLoginLog(customer) {
  try {
    const existingLog = await LoginLog.findOne({ userId: customer._id });

    if (existingLog) {
      existingLog.loginTime = new Date();
      await existingLog.save();
    } else {
      const loginLog = new LoginLog({ userId: customer._id, email: customer.email });
      await loginLog.save();
    }
  } catch {
    // No incluir errores del driver ni datos de la cuenta en los logs operativos.
    console.error('No fue posible guardar la actividad de inicio de sesión.');
  }
}

module.exports = { LoginLog, registerOrUpdateLoginLog };