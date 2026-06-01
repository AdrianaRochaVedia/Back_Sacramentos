const jwt = require('jsonwebtoken');

const generarToken2FA = (payload = {}) => {
  return new Promise((resolve, reject) => {
    jwt.sign(
      payload,
      process.env.SECRET_2FA_SEED,
      {
        expiresIn: '10m'
      },
      (err, token) => {
        if (err) reject(err);
        else resolve(token);
      }
    );
  });
};

const verificarToken2FA = (token) => {
  try {
    return jwt.verify(token, process.env.SECRET_2FA_SEED);
  } catch (error) {
    return null;
  }
};

module.exports = {
  generarToken2FA,
  verificarToken2FA
};