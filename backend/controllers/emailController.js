const nodemailer = require('nodemailer');
const crypto = require('crypto');
const bcrypt = require('bcrypt');
const Customer = require('../models/Customer');

const EMAIL_API_TIMEOUT_MS = 8000;
const SMTP_TIMEOUT_MS = 8000;

// SMTP remains available for local development. Production uses the HTTPS email API,
// because Render Free blocks outbound SMTP on ports 25, 465 and 587.
const configureTransporter = (email, password) => {
  return nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: {
      user: email,
      pass: password
    },
    connectionTimeout: SMTP_TIMEOUT_MS,
    greetingTimeout: SMTP_TIMEOUT_MS,
    socketTimeout: SMTP_TIMEOUT_MS + 2000
  });
};

const transporterGeneral = configureTransporter(process.env.GENERAL_EMAIL_ADDRESS, process.env.GENERAL_EMAIL_PASSWORD);
const transporterNoReply = configureTransporter(process.env.NO_REPLY_EMAIL_ADDRESS, process.env.NO_REPLY_EMAIL_PASSWORD);

const getEmailProviderConfig = () => ({
  apiKey: String(process.env.BREVO_API_KEY || '').trim(),
  senderEmail: String(
    process.env.BREVO_SENDER_EMAIL ||
    process.env.NO_REPLY_EMAIL_ADDRESS ||
    process.env.GENERAL_EMAIL_ADDRESS ||
    ''
  ).trim(),
  senderName: String(process.env.BREVO_SENDER_NAME || 'ElectroVibeHome').trim(),
  replyTo: String(process.env.NO_REPLY_EMAIL_ADDRESS || '').trim()
});

if (process.env.NODE_ENV === 'production') {
  const emailConfig = getEmailProviderConfig();
  console.log(
    'Estado de configuración de correo transaccional (solo indicadores, sin valores secretos):',
    JSON.stringify({
      brevoApiKeyConfigured: Boolean(emailConfig.apiKey),
      senderConfigured: Boolean(emailConfig.senderEmail),
      replyToConfigured: Boolean(emailConfig.replyTo),
      frontendUrlHttps: typeof process.env.FRONTEND_URL === 'string' && /^https:\/\//.test(process.env.FRONTEND_URL)
    })
  );
}

const sendTransactionalEmail = async ({ to, subject, text, senderEmail, replyTo }) => {
  const emailConfig = getEmailProviderConfig();
  const fromEmail = String(senderEmail || emailConfig.senderEmail || '').trim();

  if (emailConfig.apiKey) {
    if (!fromEmail) {
      const error = new Error('Transactional email sender is not configured.');
      error.code = 'EMAIL_SENDER_NOT_CONFIGURED';
      error.command = 'CONFIG';
      throw error;
    }

    const payload = {
      sender: {
        name: emailConfig.senderName,
        email: fromEmail
      },
      to: [{ email: to }],
      subject,
      textContent: text
    };
    const replyToEmail = String(replyTo || emailConfig.replyTo || '').trim();
    if (replyToEmail) {
      payload.replyTo = { email: replyToEmail };
    }

    let response;
    try {
      response = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
          accept: 'application/json',
          'content-type': 'application/json',
          'api-key': emailConfig.apiKey
        },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(EMAIL_API_TIMEOUT_MS)
      });
    } catch (error) {
      if (error && error.name === 'TimeoutError' && !error.code) {
        error.code = 'EMAIL_API_TIMEOUT';
      }
      if (error && !error.command) error.command = 'HTTPS_SEND';
      throw error;
    }

    if (!response.ok) {
      const error = new Error('Transactional email provider rejected the request.');
      error.code = 'BREVO_HTTP_ERROR';
      error.responseCode = response.status;
      error.command = 'HTTPS_SEND';
      throw error;
    }

    return response.json().catch(() => ({}));
  }

  if (process.env.NODE_ENV === 'production') {
    const error = new Error('Production email provider is not configured.');
    error.code = 'EMAIL_PROVIDER_NOT_CONFIGURED';
    error.command = 'CONFIG';
    throw error;
  }

  const transporter = senderEmail === process.env.GENERAL_EMAIL_ADDRESS
    ? transporterGeneral
    : transporterNoReply;
  return transporter.sendMail({
    to,
    from: fromEmail,
    subject,
    text
  });
};

// General transactional messages use the same HTTPS provider in production.
exports.sendGeneralEmail = async (to, subject, text) => {
  try {
    const emailConfig = getEmailProviderConfig();
    await sendTransactionalEmail({
      to,
      senderEmail: process.env.BREVO_SENDER_EMAIL || process.env.GENERAL_EMAIL_ADDRESS || emailConfig.senderEmail,
      replyTo: process.env.GENERAL_EMAIL_ADDRESS,
      subject,
      text
    });
    console.log('Correo de notificación enviado.');
  } catch (error) {
    const diagnostics = {
      provider: String(process.env.BREVO_API_KEY || '').trim() ? 'brevo-api' : 'smtp-local',
      code: typeof error?.code === 'string' ? error.code.slice(0, 40) : 'UNKNOWN',
      responseCode: Number.isInteger(error?.responseCode) ? error.responseCode : null,
      command: typeof error?.command === 'string' ? error.command.slice(0, 32) : 'UNKNOWN'
    };
    console.error('No fue posible enviar el correo de notificación. Diagnóstico seguro:', JSON.stringify(diagnostics));
  }
};

// Nunca revelar si una dirección está registrada.
const recoveryMessage = 'Si el correo está registrado, recibirás instrucciones para restablecer tu contraseña.';

exports.forgotPassword = async (req, res) => {
  const email = typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : '';
  if (!/^\S+@\S+\.\S+$/.test(email)) {
    return res.status(400).json({ message: 'Introduce un correo válido.' });
  }

  const emailConfig = getEmailProviderConfig();
  if (process.env.NODE_ENV === 'production') {
    const missingMailConfig = [];
    if (!emailConfig.apiKey) missingMailConfig.push('BREVO_API_KEY');
    if (!emailConfig.senderEmail) missingMailConfig.push('BREVO_SENDER_EMAIL o NO_REPLY_EMAIL_ADDRESS');
    if (typeof process.env.FRONTEND_URL !== 'string' || !/^https:\/\//.test(process.env.FRONTEND_URL)) {
      missingMailConfig.push('FRONTEND_URL HTTPS');
    }

    if (missingMailConfig.length > 0) {
      console.error('Servicio de recuperación no configurado. Variables faltantes:', missingMailConfig.join(', '));
      return res.status(503).json({
        message: 'El servicio de recuperación de contraseña no está disponible temporalmente. Inténtalo de nuevo más tarde.'
      });
    }
  } else {
    const missingMailConfig = [];
    if (!String(process.env.NO_REPLY_EMAIL_ADDRESS || '').trim()) missingMailConfig.push('NO_REPLY_EMAIL_ADDRESS');
    if (!String(process.env.NO_REPLY_EMAIL_PASSWORD || '').trim()) missingMailConfig.push('NO_REPLY_EMAIL_PASSWORD');
    if (missingMailConfig.length > 0 && !emailConfig.apiKey) {
      console.error('Configuración de correo local incompleta. Variables faltantes:', missingMailConfig.join(', '));
      return res.status(200).json({ message: recoveryMessage });
    }
  }

  try {
    const frontendUrl = process.env.FRONTEND_URL;
    const customer = await Customer.findOne({ email });
    if (customer) {
      if (!frontendUrl || !/^https:\/\//.test(frontendUrl)) {
        console.error('FRONTEND_URL debe configurarse con una dirección HTTPS.');
        return res.status(200).json({ message: recoveryMessage });
      }

      const token = crypto.randomBytes(32).toString('hex');
      customer.resetPasswordToken = crypto.createHash('sha256').update(token).digest('hex');
      customer.resetPasswordExpires = new Date(Date.now() + 30 * 60 * 1000);
      await customer.save();
      const resetUrl = frontendUrl.replace(/\/$/, '') + '/reset-password/' + token;

      try {
        await sendTransactionalEmail({
          to: customer.email,
          senderEmail: emailConfig.senderEmail,
          replyTo: emailConfig.replyTo,
          subject: 'Restablecer contraseña de ElectroVibeHome',
          text: 'Solicitaste restablecer tu contraseña. Abre este enlace (válido durante 30 minutos):\n\n' +
            resetUrl + '\n\nSi no lo solicitaste, ignora este mensaje.'
        });
      } catch (mailError) {
        customer.resetPasswordToken = undefined;
        customer.resetPasswordExpires = undefined;
        await customer.save();
        const diagnostics = {
          provider: String(process.env.BREVO_API_KEY || '').trim() ? 'brevo-api' : 'smtp-local',
          code: typeof mailError?.code === 'string'
            ? mailError.code.slice(0, 40)
            : (typeof mailError?.name === 'string' ? mailError.name.slice(0, 40) : 'UNKNOWN'),
          responseCode: Number.isInteger(mailError?.responseCode) ? mailError.responseCode : null,
          command: typeof mailError?.command === 'string' ? mailError.command.slice(0, 32) : 'UNKNOWN'
        };
        console.error('No fue posible enviar el correo de recuperación. Diagnóstico seguro:', JSON.stringify(diagnostics));
        // Keep the response generic so it does not disclose whether the address is registered.
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
