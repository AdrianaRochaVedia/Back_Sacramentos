// controllers/passwordController.js
const bcrypt = require('bcryptjs');
const { Op } = require('sequelize');
const crypto = require('crypto');

const Usuario = require('../models/Usuario');
const PasswordReset = require('../models/PasswordReset');
const ConfiguracionSeguridad = require('../models/ConfiguracionSeguridad');
const HistoricoPassword = require('../models/HistoricoPassword');

const { generateTokenPair, addMinutes, maskEmail } = require('../helpers/passwordReset');
const { sendMail } = require('../helpers/mailer');
const { resetPasswordEmail } = require('../helpers/emailTemplates');
const { passwordFuerte } = require('../helpers/validar-password');

const TOKEN_TTL_MINUTES = 30;
const RESET_URL_BASE = process.env.PASSWORD_RESET_URL_BASE || 'https://tu-frontend.com/reset-password';

// POST /api/password/solicitar
exports.solicitar = async (req, res) => {
  try {
    const email = (req.body.email || '').trim().toLowerCase();

    if (!email) {
      return res.status(400).json({
        ok: false,
        msg: 'Email requerido.'
      });
    }

    const usuario = await Usuario.findOne({
      where: { email, activo: true }
    });

    if (!usuario) {
      return res.json({
        ok: true,
        msg: 'Si el correo existe, se enviará un enlace de recuperación.'
      });
    }

    const { token, token_hash } = generateTokenPair();
    const expires_at = addMinutes(new Date(), TOKEN_TTL_MINUTES);

    const purpose = (!usuario.password || usuario.password.trim() === '') ? 'setup' : 'reset';

    await PasswordReset.create({
      id_usuario: usuario.id_usuario,
      token_hash,
      expires_at,
      purpose
    });

    const url = `${RESET_URL_BASE}?token=${token}`;

    try {
      const appName = process.env.APP_NAME || 'Sacramentos';

      const tpl = resetPasswordEmail({
        appName,
        resetUrl: url,
        minutes: TOKEN_TTL_MINUTES
      });

      await sendMail({
        to: email,
        subject: tpl.subject,
        html: tpl.html,
        text: tpl.text
      });

    } catch (mailErr) {
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
    return res.status(500).json({
      ok: false,
      msg: 'Error generando enlace de recuperación.'
    });
  }
};

// GET /api/password/validar?token=...
exports.validar = async (req, res) => {
  try {
    const token = (req.query.token || '').trim();

    if (!token) {
      return res.status(400).json({
        ok: false,
        msg: 'Token requerido.'
      });
    }

    const token_hash = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');

    const registro = await PasswordReset.findOne({
      where: {
        token_hash,
        used_at: { [Op.is]: null },
        expires_at: { [Op.gt]: new Date() }
      }
    });

    if (!registro) {
      return res.status(400).json({
        ok: false,
        msg: 'Token inválido o expirado.'
      });
    }

    const usuario = await Usuario.findOne({
      where: { id_usuario: registro.id_usuario }
    });

    return res.json({
      ok: true,
      email: maskEmail(usuario?.email),
      purpose: registro.purpose,
      expiresAt: registro.expires_at
    });

  } catch (e) {
    console.error(e);
    return res.status(500).json({
      ok: false,
      msg: 'Error validando token.'
    });
  }
};

// POST /api/password/cambiar
exports.cambiar = async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({
        ok: false,
        msg: 'Datos incompletos.'
      });
    }

    try {
      await passwordFuerte(newPassword);
    } catch (error) {
      return res.status(400).json({
        ok: false,
        msg: error.message
      });
    }

    const token_hash = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');

    const registro = await PasswordReset.findOne({
      where: {
        token_hash,
        used_at: { [Op.is]: null },
        expires_at: { [Op.gt]: new Date() }
      }
    });

    if (!registro) {
      return res.status(400).json({
        ok: false,
        msg: 'Token inválido o expirado.'
      });
    }

    const usuario = await Usuario.findOne({
      where: {
        id_usuario: registro.id_usuario,
        activo: true
      }
    });

    if (!usuario) {
      return res.status(400).json({
        ok: false,
        msg: 'Usuario no válido.'
      });
    }

    const config = await ConfiguracionSeguridad.findOne({
      where: { activo: true }
    });

    if (!config) {
      return res.status(500).json({
        ok: false,
        msg: 'No hay configuración de seguridad registrada.'
      });
    }

    if (!config.permite_reutilizacion) {
      const limiteHistorial = config.historial_passwords || 5;

      const historial = await HistoricoPassword.findAll({
        where: {
          id_usuario: usuario.id_usuario
        },
        order: [['fecha_cambio', 'DESC']],
        limit: limiteHistorial
      });

      const coincideConActual = usuario.password
        ? bcrypt.compareSync(newPassword, usuario.password)
        : false;

      const coincideConHistorial = historial.some((item) =>
        bcrypt.compareSync(newPassword, item.password_hash)
      );

      if (coincideConActual || coincideConHistorial) {
        return res.status(400).json({
          ok: false,
          msg: `No puedes reutilizar una de tus últimas ${limiteHistorial} contraseñas.`
        });
      }
    }

    const salt = bcrypt.genSaltSync();
    const passwordHasheada = bcrypt.hashSync(newPassword, salt);

    if (usuario.password) {
      await HistoricoPassword.create({
        id_usuario: usuario.id_usuario,
        password_hash: usuario.password
      });
    }

    await usuario.update({
      password: passwordHasheada,
      fecha_cambio_password: new Date()
    });

    await registro.update({
      used_at: new Date()
    });

    return res.json({
      ok: true,
      msg: 'Contraseña actualizada correctamente.'
    });

  } catch (e) {
    console.error(e);
    return res.status(500).json({
      ok: false,
      msg: 'Error actualizando contraseña.'
    });
  }
};