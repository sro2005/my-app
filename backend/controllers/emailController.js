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

const sendTransactionalEmail = async ({ to, subject, text, html, senderEmail, replyTo }) => {
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
    if (html) payload.htmlContent = html;
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
    text,
    ...(html ? { html } : {})
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

const escapeHtml = value => String(value).replace(/[&<>"']/g, character => ({
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;'
}[character]));

const buildPasswordResetEmail = resetUrl => {
  const safeResetUrl = escapeHtml(resetUrl);
  const text = [
    'Hola,',
    '',
    'Recibimos una solicitud para restablecer la contraseña de tu cuenta de ElectroVibeHome.',
    'Pulsa el enlace seguro para crear una nueva contraseña:',
    '',
    resetUrl,
    '',
    'Este enlace es de un solo uso y vence en 30 minutos.',
    'Si no solicitaste este cambio, puedes ignorar este correo; tu contraseña no cambiará.',
    '',
    'ElectroVibeHome · Seguridad de la cuenta'
  ].join('\n');

  const html = `<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="color-scheme" content="light">
  <title>Restablecer contraseña | ElectroVibeHome</title>
</head>
<body style="margin:0;padding:0;background:#f2f5fa;font-family:Arial,Helvetica,sans-serif;color:#18263a;">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">Un enlace seguro para recuperar el acceso a tu cuenta de ElectroVibeHome.</div>
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="width:100%;background:#f2f5fa;">
    <tr>
      <td align="center" style="padding:32px 14px;">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="600" style="width:100%;max-width:600px;border-collapse:separate;border-spacing:0;">
          <tr>
            <td style="padding:24px 28px;background:#101d31;border-radius:20px 20px 0 0;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td valign="middle" align="center" width="44" height="44" style="width:44px;height:44px;padding:0;border-radius:13px;background:#f28c28;line-height:0;font-size:0;vertical-align:middle;"><img src="https://fonts.gstatic.com/s/e/notoemoji/17.0/26a1/32.png" alt="ElectroVibeHome" width="24" height="24" style="display:block;width:24px;height:24px;margin:0 auto;border:0;outline:none;text-decoration:none;"></td>
                  <td style="padding-left:13px;color:#ffffff;font-size:16px;font-weight:800;letter-spacing:1.1px;">ELECTROVIBEHOME
                    <div style="padding-top:4px;color:#aebbd0;font-size:10px;font-weight:700;letter-spacing:2px;">CUENTA Y SEGURIDAD</div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:34px 32px 30px;background:#ffffff;border:1px solid #e1e7f0;border-top:0;">
              <div style="display:inline-block;padding:7px 11px;border-radius:999px;background:#fff2e4;color:#9b4a08;font-size:10px;font-weight:800;letter-spacing:1.1px;">RESTABLECIMIENTO DE CONTRASEÑA</div>
              <h1 style="margin:18px 0 12px;color:#142238;font-size:28px;line-height:1.2;letter-spacing:-.6px;">Volvamos a conectarte.</h1>
              <p style="margin:0 0 14px;color:#475569;font-size:15px;line-height:1.75;">Hola, recibimos una solicitud para restablecer la contraseña de tu cuenta.</p>
              <p style="margin:0 0 24px;color:#475569;font-size:15px;line-height:1.75;">Usa el siguiente botón para crear una nueva contraseña y volver a acceder de forma segura.</p>
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 24px;">
                <tr>
                  <td align="center" bgcolor="#f28c28" style="border-radius:12px;">
                    <a href="${safeResetUrl}" target="_blank" style="display:inline-block;padding:15px 23px;border:1px solid #f28c28;border-radius:12px;background:#f28c28;color:#111c2d;font-size:14px;font-weight:800;text-decoration:none;">Crear nueva contraseña&nbsp; →</a>
                  </td>
                </tr>
              </table>
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="width:100%;margin:0 0 22px;">
                <tr>
                  <td style="padding:15px 16px;border:1px solid #e2e8f0;border-radius:12px;background:#f8fafc;">
                    <p style="margin:0 0 7px;color:#334155;font-size:12px;font-weight:800;">¿El botón no funciona?</p>
                    <p style="margin:0 0 8px;color:#64748b;font-size:12px;line-height:1.6;">Copia y pega este enlace en la barra de direcciones de tu navegador:</p>
                    <a href="${safeResetUrl}" style="color:#1769aa;font-size:12px;line-height:1.6;overflow-wrap:anywhere;word-break:break-all;text-decoration:underline;">${safeResetUrl}</a>
                  </td>
                </tr>
              </table>
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="width:100%;border-collapse:collapse;">
                <tr>
                  <td valign="top" width="25" style="width:25px;padding:2px 8px 0 0;color:#d97706;font-size:17px;">⏱</td>
                  <td style="color:#475569;font-size:12px;line-height:1.7;"><strong style="color:#27364a;">Por tu seguridad</strong><br>Este enlace vence en <strong>30 minutos</strong> y solo se puede usar una vez.</td>
                </tr>
                <tr>
                  <td valign="top" width="25" style="width:25px;padding:12px 8px 0 0;color:#64748b;font-size:16px;">ⓘ</td>
                  <td style="padding-top:12px;color:#64748b;font-size:12px;line-height:1.7;">Si no solicitaste este cambio, ignora el correo. Tu contraseña actual seguirá igual.</td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td align="center" style="padding:20px 22px 26px;background:#e9eef5;border-radius:0 0 20px 20px;color:#718096;font-size:11px;line-height:1.7;">
              Este es un mensaje automático de seguridad.<br>
              <strong style="color:#42516a;">ElectroVibeHome</strong> · Energía digital para tu hogar
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
  return { text, html };
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
      // The deployed frontend uses HashRouter on Render static hosting.
      // Keep the route in the fragment so the SPA opens the reset form directly.
      const resetUrl = `${frontendUrl.replace(/\/+$/, '')}/#/reset-password/${token}`;
      const resetEmail = buildPasswordResetEmail(resetUrl);

      try {
        await sendTransactionalEmail({
          to: customer.email,
          senderEmail: emailConfig.senderEmail,
          replyTo: emailConfig.replyTo,
          subject: 'Un enlace seguro para restablecer tu contraseña | ElectroVibeHome',
          text: resetEmail.text,
          html: resetEmail.html
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
