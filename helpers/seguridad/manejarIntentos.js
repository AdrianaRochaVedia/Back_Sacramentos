const ConfiguracionSeguridad = require('../../models/ConfiguracionSeguridad');

const verificarBloqueo = async (usuario) => {
    if (!usuario.bloqueado) return { bloqueado: false };
    const config = await ConfiguracionSeguridad.findOne({ where: { activo: true } });
    if (!config) throw new Error('No hay configuración de seguridad registrada');

    const ahora = new Date();
    const fechaDesbloqueo = new Date(usuario.fecha_bloqueo);
    fechaDesbloqueo.setMinutes(fechaDesbloqueo.getMinutes() + config.tiempo_bloqueo_minutos);
    if (ahora >= fechaDesbloqueo) {
        await usuario.update({
            bloqueado: false,
            fecha_bloqueo: null,
            intentos_fallidos: 0
        });
        return { bloqueado: false };
    }

    const minutosRestantes = Math.ceil((fechaDesbloqueo - ahora) / 60000);
    return {
        bloqueado: true,
        msg: `Usuario bloqueado. Intente nuevamente en ${minutosRestantes} minuto(s)`
    };
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