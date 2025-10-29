// helpers/passwordReset.js
const crypto = require('crypto');

function generateTokenPair() {
  const token = crypto.randomBytes(32).toString('hex'); // visible en link
  const token_hash = crypto.createHash('sha256').update(token).digest('hex'); // guardamos hash
  return { token, token_hash };
}

function addMinutes(date, minutes) {
  return new Date(date.getTime() + minutes * 60000);
}

function maskEmail(email) {
  if (!email) return '';
  const [local, domain] = email.split('@');
  if (!domain) return email;
  const maskedLocal =
    local.length <= 2 ? local[0] + '*' : local[0] + '*'.repeat(local.length - 2) + local[local.length - 1];
  return `${maskedLocal}@${domain}`;
}

module.exports = { generateTokenPair, addMinutes, maskEmail };