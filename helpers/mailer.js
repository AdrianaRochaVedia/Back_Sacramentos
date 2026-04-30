const { Resend } = require('resend');

async function sendMail({ to, subject, html, text }) {
  if (!process.env.RESEND_API_KEY) {
    throw new Error('Falta RESEND_API_KEY en variables de entorno');
  }

  if (!process.env.MAIL_FROM) {
    throw new Error('Falta MAIL_FROM en variables de entorno');
  }

  const resend = new Resend(process.env.RESEND_API_KEY);

  const { data, error } = await resend.emails.send({
    from: process.env.MAIL_FROM,
    to,
    subject,
    html,
    text,
  });

  if (error) {
    console.error('Error Resend:', error);
    throw new Error(error.message || 'Error enviando correo');
  }

  return data;
}

async function verify() {
  console.log('Mailer activo con Resend API');
}

module.exports = {
  sendMail,
  verify,
};