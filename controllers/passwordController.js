// controllers/passwordController.js
const bcrypt = require('bcryptjs');
const { Op } = require('sequelize');
const crypto = require('crypto');

const Usuario = require('../models/Usuario'); // ya existe en tu proyecto
const PasswordReset = require('../models/PasswordReset');
const { generateTokenPair, addMinutes, maskEmail } = require('../helpers/passwordReset');
const { sendMail } = require('../helpers/mailer');
const { resetPasswordEmail } = require('../helpers/emailTemplates');

const TOKEN_TTL_MINUTES = 30; // vigencia del token
const RESET_URL_BASE = process.env.PASSWORD_RESET_URL_BASE || 'https://tu-frontend.com/reset-password';

// POST /api/password/solicitar   body: { email }
exports.solicitar = async (req, res) => {
  try {
    const email = (req.body.email || '').trim().toLowerCase();
    if (!email) return res.status(400).json({ ok: false, msg: 'Email requerido.' });

    const usuario = await Usuario.findOne({ where: { email, activo: true } });

    // Siempre responder 200 para no filtrar si existe o no
    if (!usuario) {
      return res.json({
        ok: true,
        msg: 'Si el correo existe, se enviará un enlace de recuperación.'
      });
    }

    // Generar token (hash guardado)
    const { token, token_hash } = generateTokenPair();
    const expires_at = addMinutes(new Date(), TOKEN_TTL_MINUTES);

    // purpose heurístico sin tocar usuarios: si no tiene password o está vacío => setup, si no => reset
    const purpose = (!usuario.password || usuario.password.trim() === '') ? 'setup' : 'reset';

    await PasswordReset.create({
      id_usuario: usuario.id_usuario,
      token_hash,
      expires_at,
      purpose
    });

    // Enviamos el correo desde el backend y también devolvemos la URL (opcional para debugging)
    const url = `${RESET_URL_BASE}?token=${token}`;

    // Enviar correo de restablecimiento
    try {
      const appName = process.env.APP_NAME || 'Sacramentos';
      const tpl = resetPasswordEmail({ appName, resetUrl: url, minutes: TOKEN_TTL_MINUTES });
      await sendMail({
        to: email,
        subject: tpl.subject,
        html: tpl.html,
        text: tpl.text,
      });
    } catch (mailErr) {
      // No revelar estado de la cuenta por correo fallido
      console.warn('Error enviando email de reset:', mailErr?.message || mailErr);
    }

    return res.json({
      ok: true,
      msg: 'Si el correo existe, se enviará un enlace de recuperación.',
      url,
      expiresAt: expires_at
    });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ ok: false, msg: 'Error generando enlace de recuperación.' });
  }
};

// GET /api/password/validar?token=...
exports.validar = async (req, res) => {
  try {
    const token = (req.query.token || '').trim();
    if (!token) return res.status(400).json({ ok: false, msg: 'Token requerido.' });

    const token_hash = crypto.createHash('sha256').update(token).digest('hex');

    const registro = await PasswordReset.findOne({
      where: {
        token_hash,
        used_at: { [Op.is]: null },
        expires_at: { [Op.gt]: new Date() }
      }
    });

    if (!registro) return res.status(400).json({ ok: false, msg: 'Token inválido o expirado.' });

    const usuario = await Usuario.findOne({ where: { id_usuario: registro.id_usuario } });

    return res.json({
      ok: true,
      email: maskEmail(usuario?.email),
      purpose: registro.purpose,
      expiresAt: registro.expires_at
    });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ ok: false, msg: 'Error validando token.' });
  }
};

// POST /api/password/cambiar   body: { token, newPassword }
exports.cambiar = async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({ ok: false, msg: 'Datos incompletos.' });
    }
    if (newPassword.length < 8) {
      return res.status(400).json({ ok: false, msg: 'Password muy corto (min 8).' });
    }

    const token_hash = crypto.createHash('sha256').update(token).digest('hex');

    const registro = await PasswordReset.findOne({
      where: {
        token_hash,
        used_at: { [Op.is]: null },
        expires_at: { [Op.gt]: new Date() }
      }
    });

    if (!registro) return res.status(400).json({ ok: false, msg: 'Token inválido o expirado.' });

    const usuario = await Usuario.findOne({ where: { id_usuario: registro.id_usuario, activo: true } });
    if (!usuario) return res.status(400).json({ ok: false, msg: 'Usuario no válido.' });

    // Hash de la nueva contraseña
    const salt = bcrypt.genSaltSync();
    const passwordHasheada = bcrypt.hashSync(newPassword, salt);

    await usuario.update({ password: passwordHasheada });

    // invalidar token
    await registro.update({ used_at: new Date() });

    return res.json({ ok: true, msg: 'Contraseña actualizada correctamente.' });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ ok: false, msg: 'Error actualizando contraseña.' });
  }
};
