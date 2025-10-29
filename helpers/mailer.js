const nodemailer = require('nodemailer');

// Configuración del transportador con variables de entorno
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT || 587),
  secure: process.env.SMTP_SECURE === 'true', // true para 465, false para 587
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

// Verificación opcional al iniciar el servidor
async function verify() {
  try {
    await transporter.verify();
    console.log('Conexión SMTP verificada con éxito.');
  } catch (e) {
    console.warn('Advertencia SMTP:', e?.message || e);
  }
}

// Función genérica para enviar correos
async function sendMail({ to, subject, html, text }) {
  const from = process.env.MAIL_FROM || process.env.SMTP_USER;
  return transporter.sendMail({
    from,
    to,
    subject,
    html,
    text
  });
}

module.exports = { transporter, sendMail, verify };
