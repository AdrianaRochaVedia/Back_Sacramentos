const fetch = require('node-fetch');

const verifyTurnstileToken = async ({ token, remoteip }) => {
  if (!token) {
    return {
      ok: false,
      msg: 'Token de captcha requerido'
    };
  }

  const secret = process.env.TURNSTILE_SECRET_KEY;

  if (!secret) {
    throw new Error('Falta configurar TURNSTILE_SECRET_KEY en variables de entorno');
  }

  const params = new URLSearchParams();
  params.append('secret', secret);
  params.append('response', token);

  if (remoteip) {
    params.append('remoteip', remoteip);
  }

  const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
    method: 'POST',
    body: params
  });

  const data = await response.json();

  if (!data.success) {
    return {
      ok: false,
      msg: 'Captcha inválido',
      errors: data['error-codes'] || []
    };
  }

  return {
    ok: true,
    data
  };
};

module.exports = {
  verifyTurnstileToken
};