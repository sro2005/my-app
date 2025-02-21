const mongoose = require('mongoose');

const loginLogSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true },
  email: { type: String, required: true },
  loginTime: { type: Date, default: Date.now },
});

const LoginLog = mongoose.model('LoginLog', loginLogSchema);

// Función para registrar o actualizar el log de login
async function registerOrUpdateLoginLog(customer) {
  try {
    // Verificar si ya existe un registro para este usuario
    const existingLog = await LoginLog.findOne({ userId: customer._id });

    if (existingLog) {
      // Si ya existe, actualiza el loginTime
      existingLog.loginTime = new Date();
      await existingLog.save();
      console.log('Login log actualizado:', existingLog);
    } else {
      // Si no existe, crea un nuevo registro
      const loginLog = new LoginLog({ userId: customer._id, email: customer.email });
      await loginLog.save();
      console.log('Nuevo login log registrado:', loginLog);
    }
  } catch (error) {
    console.error('Error registrando el login log:', error);
  }
}

module.exports = { LoginLog, registerOrUpdateLoginLog };