const bcrypt = require('bcryptjs');
const ConfiguracionSeguridad = require('../../models/ConfiguracionSeguridad');
const HistoricoPassword = require('../../models/HistoricoPassword');

const verificarHistorial = async (id_usuario, nuevaPassword) => {
    const config = await ConfiguracionSeguridad.findOne({ where: { activo: true } });
    if (!config) throw new Error('No hay configuración de seguridad registrada');
    if (config.permite_reutilizacion) return { ok: true };

    const historial = await HistoricoPassword.findAll({
        where: { id_usuario },
        order: [['fecha_cambio', 'DESC']],
        limit: config.historial_passwords
    });

    for (const registro of historial) {
        const yaUsada = bcrypt.compareSync(nuevaPassword, registro.password_hash);
        if (yaUsada) {
            return {
                ok: false,
                msg: `La contraseña ya fue usada en las últimas ${config.historial_passwords} contraseñas`
            };
        }
    }
    return { ok: true };
};

const guardarEnHistorial = async (id_usuario, passwordHasheada) => {
    await HistoricoPassword.create({
        id_usuario,
        password_hash: passwordHasheada
    });
};

module.exports = { 
    verificarHistorial, 
    guardarEnHistorial 
};