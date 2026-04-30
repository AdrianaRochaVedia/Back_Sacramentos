const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT || 587),
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  },
  connectionTimeout: 8000,
  greetingTimeout: 8000,
  socketTimeout: 8000,
});

async function verify() {
  try {
    await transporter.verify();
    console.log('Conexión SMTP verificada con éxito.');
  } catch (e) {
    console.warn('Advertencia SMTP:', e?.message || e);
  }
}

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