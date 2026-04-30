const ConfiguracionSeguridad = require('../../models/ConfiguracionSeguridad');

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
    const config = await ConfiguracionSeguridad.findOne({ where: { activo: true } });
    if (!config) throw new Error('No hay configuración de seguridad registrada');
    const nuevoIntentos = usuario.intentos_fallidos + 1;
    if (nuevoIntentos >= config.max_intentos_fallidos) {
        await usuario.update({
            intentos_fallidos: nuevoIntentos,
            bloqueado: true,
            fecha_bloqueo: new Date()
        });
        return {
            bloqueado: true,
            msg: `Usuario bloqueado por ${config.tiempo_bloqueo_minutos} minuto(s) por demasiados intentos fallidos`
        };
    }

    await usuario.update({ intentos_fallidos: nuevoIntentos });
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