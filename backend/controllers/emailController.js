const nodemailer = require('nodemailer');
const crypto = require('crypto');
const Customer = require('../models/Customer');

// Configuración de Nodemailer
const configureTransporter = (email, password) => {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: email,
      pass: password
    }
  });
};

const transporterGeneral = configureTransporter(process.env.GENERAL_EMAIL_ADDRESS, process.env.GENERAL_EMAIL_PASSWORD);
const transporterSupport = configureTransporter(process.env.SUPPORT_EMAIL_ADDRESS, process.env.SUPPORT_EMAIL_PASSWORD);
const transporterNoReply = configureTransporter(process.env.NO_REPLY_EMAIL_ADDRESS, process.env.NO_REPLY_EMAIL_PASSWORD);

// Ejemplo de función para enviar correo general
exports.sendGeneralEmail = (to, subject, text) => {
  const mailOptions = {
    to,
    from: process.env.GENERAL_EMAIL_ADDRESS,
    subject,
    text
  };

  transporterGeneral.sendMail(mailOptions, (err, response) => {
    if (err) {
      console.error('Error al enviar el correo:', err);
    } else {
      console.log('Correo enviado:', response);
    }
  });
};

// Ejemplo de función para enviar correo de soporte técnico
exports.sendSupportEmail = (to, subject, text) => {
  const mailOptions = {
    to,
    from: process.env.SUPPORT_EMAIL_ADDRESS,
    subject,
    text
  };

  transporterSupport.sendMail(mailOptions, (err, response) => {
    if (err) {
      console.error('Error al enviar el correo:', err);
    } else {
      console.log('Correo enviado:', response);
    }
  });
};

// Recuperar contraseña
exports.forgotPassword = async (req, res) => {
  const { email } = req.body;
  try {
    const customer = await Customer.findOne({ email });
    if (!customer) {
      return res.status(404).send({ message: 'Correo electrónico no encontrado' });
    }

    const token = crypto.randomBytes(20).toString('hex');
    customer.resetPasswordToken = token;
    customer.resetPasswordExpires = Date.now() + 3600000; // 1 hora
    await customer.save();

    // Construir la URL de restablecimiento usando FRONTEND_URL o el host de la petición
    const resetUrl = `${process.env.FRONTEND_URL || `https://${req.headers.host}`}/reset-password/${token}`;

    const mailOptions = {
      to: customer.email,
      from: process.env.NO_REPLY_EMAIL_ADDRESS,
      subject: 'Restablecimiento de contraseña',
      text: `Recibiste este correo porque tú (o alguien más) solicitaste restablecer la contraseña de tu cuenta.\n\n` +
            `Haz clic en el siguiente enlace, o pégalo en tu navegador para completar el proceso:\n\n` +
            `${resetUrl}\n\n` +
            `Si no solicitaste este cambio, ignora este correo y tu contraseña permanecerá sin cambios.\n`
    };

    // Enviar el correo utilizando async/await
    await transporterNoReply.sendMail(mailOptions);
    res.status(200).json({ message: 'Correo de recuperación enviado con éxito' });
  } catch (error) {
    console.error('Error en el proceso de recuperación:', error);
    res.status(500).json({ message: 'Error en el proceso de recuperación' });
  }
};