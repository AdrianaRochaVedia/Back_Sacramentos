const fetch = require('node-fetch');

async function validarEmailZeroBounce(email) {
  if (!process.env.ZEROBOUNCE_API_KEY) {
    throw new Error('Falta ZEROBOUNCE_API_KEY en variables de entorno');
  }

  const url = new URL('https://api.zerobounce.net/v2/validate');
  url.searchParams.append('api_key', process.env.ZEROBOUNCE_API_KEY);
  url.searchParams.append('email', email);

  const response = await fetch(url.toString());

  if (!response.ok) {
    throw new Error('Error validando correo con ZeroBounce');
  }

  return await response.json();
}

function emailEsEnviable(resultado) {
  const bloqueados = [
    'invalid',
    'spamtrap',
    'abuse',
    'do_not_mail'
  ];

  if (bloqueados.includes(resultado.status)) {
    return false;
  }

  if (resultado.sub_status === 'mailbox_not_found') {
    return false;
  }

  return true;
}

module.exports = {
  validarEmailZeroBounce,
  emailEsEnviable
};