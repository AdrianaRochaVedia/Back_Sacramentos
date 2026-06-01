const { Resend } = require('resend');
const {
  validarEmailZeroBounce,
  emailEsEnviable
} = require('./emailValidator');

const resend = new Resend(process.env.RESEND_API_KEY);

async function sendMail({ to, subject, html, text, validarCorreo = true }) {
  if (!process.env.RESEND_API_KEY) {
    throw new Error('Falta RESEND_API_KEY en variables de entorno');
  }

  if (!process.env.MAIL_FROM) {
    throw new Error('Falta MAIL_FROM en variables de entorno');
  }

  if (validarCorreo) {
    const resultado = await validarEmailZeroBounce(to);

    console.log('ZeroBounce:', {
      email: to,
      status: resultado.status,
      sub_status: resultado.sub_status
    });

    if (!emailEsEnviable(resultado)) {
      throw new Error(
        `Correo inválido: ${resultado.status} - ${resultado.sub_status || 'sin detalle'}`
      );
    }
  }

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
  console.log('Mailer activo con Resend + ZeroBounce');
}

module.exports = {
  sendMail,
  verify,
};