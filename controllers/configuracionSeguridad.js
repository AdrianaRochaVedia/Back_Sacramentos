const ConfiguracionSeguridad = require('../models/ConfiguracionSeguridad');

// Obtener configuración de seguridad
const getConfiguracion = async (req, res) => {
    try {
        const config = await ConfiguracionSeguridad.findOne({ where: { activo: true } });
        if (!config) {
            return res.status(404).json({ ok: false, msg: 'No hay configuración de seguridad registrada' });
        }
        res.json({ ok: true, configuracion: config });
    } catch (error) {
        console.error(error);
        res.status(500).json({ ok: false, msg: 'Error al obtener la configuración' });
    }
};

// Actualizar configuración de seguridad
const actualizarConfiguracion = async (req, res) => {
    const {
        longitud_minima,
        longitud_maxima,
        requiere_mayuscula,
        requiere_minuscula,
        requiere_numero,
        requiere_caracter_especial,
        max_intentos_fallidos,
        tiempo_bloqueo_minutos,
        historial_passwords,
        vida_util_password_dias,
        permite_reutilizacion,
        usa_2fa,
        usa_captcha
    } = req.body;

    try {
        const config = await ConfiguracionSeguridad.findOne({ where: { activo: true } });
        if (!config) {
            return res.status(404).json({ ok: false, msg: 'No hay configuración de seguridad registrada' });
        }

        if (longitud_minima && longitud_maxima && longitud_minima >= longitud_maxima) {
            return res.status(400).json({ ok: false, msg: 'La longitud mínima debe ser menor a la longitud máxima' });
        }

        if (longitud_minima && longitud_minima >= (longitud_maxima || config.longitud_maxima)) {
            return res.status(400).json({ ok: false, msg: 'La longitud mínima debe ser menor a la longitud máxima' });
        }

        if (longitud_maxima && longitud_maxima <= (longitud_minima || config.longitud_minima)) {
            return res.status(400).json({ ok: false, msg: 'La longitud máxima debe ser mayor a la longitud mínima' });
        }

        const updates = {};
        if (longitud_minima !== undefined) updates.longitud_minima = longitud_minima;
        if (longitud_maxima !== undefined) updates.longitud_maxima = longitud_maxima;
        if (requiere_mayuscula !== undefined) updates.requiere_mayuscula = requiere_mayuscula;
        if (requiere_minuscula !== undefined) updates.requiere_minuscula = requiere_minuscula;
        if (requiere_numero !== undefined) updates.requiere_numero = requiere_numero;
        if (requiere_caracter_especial !== undefined) updates.requiere_caracter_especial = requiere_caracter_especial;
        if (max_intentos_fallidos !== undefined) updates.max_intentos_fallidos = max_intentos_fallidos;
        if (tiempo_bloqueo_minutos !== undefined) updates.tiempo_bloqueo_minutos = tiempo_bloqueo_minutos;
        if (historial_passwords !== undefined) updates.historial_passwords = historial_passwords;
        if (vida_util_password_dias !== undefined) updates.vida_util_password_dias = vida_util_password_dias;
        if (permite_reutilizacion !== undefined) updates.permite_reutilizacion = permite_reutilizacion;
        if (usa_2fa !== undefined) updates.usa_2fa = usa_2fa;
        if (usa_captcha !== undefined) updates.usa_captcha = usa_captcha;
        updates.fecha_actualizacion = new Date();

        await config.update(updates);
        res.json({ ok: true, msg: 'Configuración actualizada correctamente', configuracion: config });

    } catch (error) {
        console.error(error);
        res.status(500).json({ ok: false, msg: 'Error al actualizar la configuración' });
    }
};

module.exports = { 
    getConfiguracion, 
    actualizarConfiguracion 
};