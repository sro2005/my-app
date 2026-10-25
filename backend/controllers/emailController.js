const nodemailer = require('nodemailer');
const crypto = require('crypto');
const bcrypt = require('bcrypt');
const Customer = require('../models/Customer');

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

    await transporterGeneral.sendMail(mailOptions);
    console.log('Correo de notificación enviado.');
  } catch (err) {
    console.error('No fue posible enviar el correo de notificación.');
  }
};

// Nunca revelar si una dirección está registrada.
const recoveryMessage = 'Si el correo está registrado, recibirás instrucciones para restablecer tu contraseña.';

exports.forgotPassword = async (req, res) => {
  const email = typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : '';
  if (!/^\S+@\S+\.\S+$/.test(email)) {
    return res.status(400).json({ message: 'Introduce un correo válido.' });
  }
  const missingMailConfig = [];
  if (!String(process.env.NO_REPLY_EMAIL_ADDRESS || '').trim()) missingMailConfig.push('NO_REPLY_EMAIL_ADDRESS');
  if (!String(process.env.NO_REPLY_EMAIL_PASSWORD || '').trim()) missingMailConfig.push('NO_REPLY_EMAIL_PASSWORD');
  if (missingMailConfig.length > 0) {
    console.error('Configuración SMTP de recuperación incompleta. Variables faltantes:', missingMailConfig.join(', '));
    return res.status(200).json({ message: recoveryMessage });
  }

  try {
    const customer = await Customer.findOne({ email });
    if (customer) {
      const frontendUrl = process.env.FRONTEND_URL;
      if (!frontendUrl || !/^https:\/\//.test(frontendUrl)) {
        console.error('FRONTEND_URL debe configurarse con una dirección HTTPS.');
        return res.status(200).json({ message: recoveryMessage });
      }
      const token = crypto.randomBytes(32).toString('hex');
      customer.resetPasswordToken = crypto.createHash('sha256').update(token).digest('hex');
      customer.resetPasswordExpires = new Date(Date.now() + 30 * 60 * 1000);
      await customer.save();
      const resetUrl = `${frontendUrl.replace(/\/$/, '')}/reset-password/${token}`;
      try {
        await transporterNoReply.sendMail({
          to: customer.email,
          from: process.env.NO_REPLY_EMAIL_ADDRESS,
          subject: 'Restablecer contraseña de ElectroVibeHome',
          text: `Solicitaste restablecer tu contraseña. Abre este enlace (válido durante 30 minutos):\n\n${resetUrl}\n\nSi no lo solicitaste, ignora este mensaje.`
        });
      } catch (mailError) {
        customer.resetPasswordToken = undefined;
        customer.resetPasswordExpires = undefined;
        await customer.save();
        const smtpDiagnostics = {
          code: typeof mailError?.code === 'string' ? mailError.code.slice(0, 40) : 'UNKNOWN',
          responseCode: Number.isInteger(mailError?.responseCode) ? mailError.responseCode : null,
          command: typeof mailError?.command === 'string' ? mailError.command.slice(0, 32) : 'UNKNOWN'
        };
        console.error('No fue posible enviar el correo de recuperación. Diagnóstico SMTP sin credenciales:', JSON.stringify(smtpDiagnostics));
        return res.status(200).json({ message: recoveryMessage });
      }
    }
    return res.status(200).json({ message: recoveryMessage });
  } catch (error) {
    console.error('No fue posible procesar la recuperación de contraseña.');
    return res.status(500).json({ message: 'No fue posible procesar la solicitud.' });
  }
};

exports.resetPassword = async (req, res) => {
  const { token } = req.params;
  const { password } = req.body || {};
  const validPassword = typeof password === 'string' &&
    password.length >= 10 &&
    password.length <= 128 &&
    /[a-z]/.test(password) &&
    /[A-Z]/.test(password) &&
    /[0-9]/.test(password) &&
    /[!@#$%^&*]/.test(password);

  if (!/^[a-f0-9]{64}$/.test(token || '') || !validPassword) {
    return res.status(400).json({
      message: 'Enlace o contraseña inválidos. Usa entre 10 y 128 caracteres, con mayúscula, minúscula, número y símbolo.'
    });
  }

  try {
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const passwordHash = await bcrypt.hash(password, 12);

    // Consumir el token de forma atómica: dos solicitudes simultáneas no pueden
    // reutilizar el mismo enlace para cambiar la contraseña más de una vez.
    const updatedCustomer = await Customer.findOneAndUpdate(
      {
        resetPasswordToken: tokenHash,
        resetPasswordExpires: { $gt: new Date() }
      },
      {
        $set: { password: passwordHash },
        $unset: { resetPasswordToken: 1, resetPasswordExpires: 1 }
      },
      { new: true, runValidators: true }
    );

    if (!updatedCustomer) {
      return res.status(400).json({ message: 'El enlace expiró o ya fue utilizado. Solicita uno nuevo.' });
    }
    return res.status(200).json({ message: 'Contraseña actualizada. Ya puedes iniciar sesión.' });
  } catch (error) {
    console.error('No fue posible restablecer la contraseña.');
    return res.status(500).json({ message: 'No fue posible restablecer la contraseña.' });
  }
};
