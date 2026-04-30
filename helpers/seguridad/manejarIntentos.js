const ConfiguracionSeguridad = require('../../models/ConfiguracionSeguridad');
const { sendMail } = require('../mailer');
const { cuentaBloqueadaEmail } = require('../emailTemplates');

const enviarCorreoBloqueo = async (usuario, tiempoBloqueo) => {
  try {
    if (!usuario?.email) {
      console.warn('No se envió correo de bloqueo: usuario sin email');
      return;
    }

    console.log('Preparando correo de bloqueo para:', usuario.email);

    const appName = process.env.APP_NAME || 'Sacramentos';

    const tpl = cuentaBloqueadaEmail({
      appName,
      nombre: usuario.nombre,
      tiempoBloqueo
    });

    await sendMail({
      to: usuario.email,
      subject: tpl.subject,
      text: tpl.text,
      html: tpl.html
    });

    console.log('Correo de bloqueo enviado correctamente a:', usuario.email);

  } catch (error) {
    console.error('No se pudo enviar correo de bloqueo:', error);
  }
};

const verificarBloqueo = async (usuario) => {
  if (usuario.bloqueado) {
    return {
      bloqueado: true,
      msg: 'Usuario bloqueado. Contacte al administrador de usuarios.'
    };
  }

  return { bloqueado: false };
};

const registrarIntentoFallido = async (usuario) => {
  const config = await ConfiguracionSeguridad.findOne({
    where: { activo: true }
  });

  if (!config) {
    throw new Error('No hay configuración de seguridad registrada');
  }

  const nuevoIntentos = Number(usuario.intentos_fallidos || 0) + 1;

  if (nuevoIntentos >= Number(config.max_intentos_fallidos)) {
    const yaEstabaBloqueado = usuario.bloqueado === true;

    await usuario.update({
      intentos_fallidos: nuevoIntentos,
      bloqueado: true,
      fecha_bloqueo: new Date()
    });

    if (!yaEstabaBloqueado) {
      await enviarCorreoBloqueo(usuario, config.tiempo_bloqueo_minutos);
    }

    return {
      bloqueado: true,
      msg: `Usuario bloqueado por demasiados intentos fallidos (${nuevoIntentos}/${config.max_intentos_fallidos}). Contacte al administrador de usuarios.`
    };
  }

  await usuario.update({
    intentos_fallidos: nuevoIntentos
  });

  return {
    bloqueado: false,
    msg: `Contraseña incorrecta. Intentos fallidos: ${nuevoIntentos}/${config.max_intentos_fallidos}`
  };
};

const resetearIntentos = async (usuario) => {
  await usuario.update({
    intentos_fallidos: 0,
    bloqueado: false,
    fecha_bloqueo: null
  });
};

module.exports = {
  verificarBloqueo,
  registrarIntentoFallido,
  resetearIntentos
};