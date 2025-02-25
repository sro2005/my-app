const nodemailer = require('nodemailer');
const crypto = require('crypto');
const Customer = require('../models/Customer');

// ✅ Verifica que las variables de entorno se están cargando correctamente
console.log('Correo General:', process.env.GENERAL_EMAIL_ADDRESS);
console.log('Correo No Reply:', process.env.NO_REPLY_EMAIL_ADDRESS);
console.log('Contraseña No Reply:', process.env.NO_REPLY_EMAIL_PASSWORD ? 'Cargada' : 'No cargada');

// ✅ Configuración de Nodemailer con SMTP de Gmail
const configureTransporter = (email, password) => {
  return nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false, // true para 465, false para otros puertos
    auth: {
      user: email,
      pass: password
    }
  });
};

// 🔹 Transporters para diferentes correos
const transporterGeneral = configureTransporter(process.env.GENERAL_EMAIL_ADDRESS, process.env.GENERAL_EMAIL_PASSWORD);
const transporterNoReply = configureTransporter(process.env.NO_REPLY_EMAIL_ADDRESS, process.env.NO_REPLY_EMAIL_PASSWORD);

// ✅ Función para enviar correos genéricos
exports.sendGeneralEmail = async (to, subject, text) => {
  try {
    const mailOptions = {
      to,
      from: process.env.GENERAL_EMAIL_ADDRESS,
      subject,
      text
    };

    const response = await transporterGeneral.sendMail(mailOptions);
    console.log('📩 Correo enviado con éxito:', response);
  } catch (err) {
    console.error('❌ Error al enviar el correo:', err);
  }
};

// ✅ Recuperar contraseña
exports.forgotPassword = async (req, res) => {
  const { email } = req.body;
  try {
    // 1️⃣ Verifica si el usuario existe en la base de datos
    const customer = await Customer.findOne({ email });
    if (!customer) {
      return res.status(404).json({ message: 'Correo electrónico no encontrado' });
    }

    // 2️⃣ Genera un token de recuperación
    const token = crypto.randomBytes(20).toString('hex');
    customer.resetPasswordToken = token;
    customer.resetPasswordExpires = Date.now() + 3600000; // Expira en 1 hora
    await customer.save();

    // 3️⃣ Construye la URL de restablecimiento
    const resetUrl = `${process.env.FRONTEND_URL || `https://${req.headers.host}`}/reset-password/${token}`;
    console.log('🔗 URL de restablecimiento:', resetUrl);

    // 4️⃣ Opciones del correo de restablecimiento
    const mailOptions = {
      to: customer.email,
      from: process.env.NO_REPLY_EMAIL_ADDRESS,
      subject: '🔑 Restablecimiento de contraseña',
      text: `Recibiste este correo porque solicitaste restablecer tu contraseña.\n\n` +
            `Haz clic en el siguiente enlace o cópialo en tu navegador para continuar:\n\n` +
            `${resetUrl}\n\n` +
            `Si no solicitaste este cambio, ignora este correo.\n`
    };

    // 5️⃣ Enviar el correo
    await transporterNoReply.sendMail(mailOptions);
    res.status(200).json({ message: '📩 Correo de recuperación enviado con éxito' });

  } catch (error) {
    console.error('❌ Error en el proceso de recuperación:', error);
    res.status(500).json({ message: 'Error en el proceso de recuperación', error: error.message });
  }
};
