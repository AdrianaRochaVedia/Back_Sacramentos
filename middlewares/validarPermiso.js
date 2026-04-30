const Usuario = require('../models/Usuario');
const Rol = require('../models/Rol');
const Permiso = require('../models/Permisos');

const validarPermiso = (permisoRequerido) => {
    return async (req, res, next) => {
        try {
            const usuario = await Usuario.findOne({
                where: { id_usuario: req.uid, activo: true },
                include: [{
                    model: Rol,
                    as: 'rol',
                    include: [{
                        model: Permiso,
                        as: 'permisos',
                        attributes: ['nombre']
                    }]
                }]
            });

            if (!usuario) {
                return res.status(401).json({ ok: false, msg: 'Usuario no encontrado' });
            }
            const permisos = usuario.rol?.permisos?.map(p => p.nombre) || [];
            if (!permisos.includes(permisoRequerido)) {
                return res.status(403).json({ ok: false, msg: `No tienes permiso para realizar esta acción (${permisoRequerido})` });
            }
            req.permisos = permisos; 
            next();
        } catch (error) {
            console.error(error);
            res.status(500).json({ ok: false, msg: 'Error al verificar permisos' });
        }
    };
};

module.exports = { validarPermiso };