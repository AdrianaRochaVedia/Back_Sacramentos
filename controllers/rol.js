const { Op } = require('sequelize');
const Rol = require('../models/Rol');
const Usuario = require('../models/Usuario');
const Permiso = require('../models/Permisos');
const RolPermiso = require('../models/RolPermiso');

//Roles con sus permisos
const getRoles = async (req, res) => {
    try {
        const roles = await Rol.findAll({
            where: { activo: true },
            include: [{
                model: Permiso,
                as: 'permisos',
                attributes: ['id_permiso', 'nombre'],
                through: { attributes: ['fecha_registro'] }
            }],
            order: [['id_rol', 'ASC']]
        });

        res.json({ ok: true, roles });

    } catch (error) {
        console.error(error);
        res.status(500).json({ ok: false, msg: 'Error al obtener los roles' });
    }
};

//Rol por id
const getRolById = async (req, res) => {
    const { id } = req.params;

    try {
        const rol = await Rol.findOne({
            where: { id_rol: id, activo: true },
            include: [{
                model: Permiso,
                as: 'permisos',
                attributes: ['id_permiso', 'nombre'],
                through: { attributes: ['fecha_registro'] }
            }]
        });

        if (!rol) {
            return res.status(404).json({ ok: false, msg: 'Rol no encontrado' });
        }

        res.json({ ok: true, rol });

    } catch (error) {
        console.error(error);
        res.status(500).json({ ok: false, msg: 'Error al obtener el rol' });
    }
};

//Verificar su ya existe un rol con los mismos permisos para que no deje crear otro
const verificarPermisosRepetidos = async (permisosIds, excludeRolId = null) => {
    const roles = await Rol.findAll({
        where: {
            activo: true,
            ...(excludeRolId && { id_rol: { [Op.ne]: excludeRolId } })
        },
        include: [{
            model: Permiso,
            as: 'permisos',
            attributes: ['id_permiso']
        }]
    });

    const permisosOrdenados = [...permisosIds].sort().join(',');

    const rolDuplicado = roles.find(rol => {
        const permisosRol = rol.permisos.map(p => p.id_permiso).sort().join(',');
        return permisosRol === permisosOrdenados;
    });

    return rolDuplicado || null;
};

const crearRol = async (req, res) => {
    const { nombre, descripcion, permisos = [] } = req.body;
    try {
        const nombreExiste = await Rol.findOne({ where: { nombre, activo: true } });
        if (nombreExiste) {
            return res.status(400).json({ ok: false, msg: `Ya existe un rol con el nombre "${nombre}"` });
        }

        if (permisos.length > 0) {
            const rolDuplicado = await verificarPermisosRepetidos(permisos);
            if (rolDuplicado) {
                return res.status(400).json({
                    ok: false,
                    msg: `Ya existe el rol "${rolDuplicado.nombre}" con exactamente los mismos permisos`
                });
            }
        }

        const rol = await Rol.create({ nombre, descripcion });
        if (permisos.length > 0) {
            const rolPermisos = permisos.map(id_permiso => ({
                id_rol: rol.id_rol,
                id_permiso
            }));
            await RolPermiso.bulkCreate(rolPermisos);
        }

        const rolConPermisos = await Rol.findByPk(rol.id_rol, {
            include: [{
                model: Permiso,
                as: 'permisos',
                attributes: ['id_permiso', 'nombre'],
                through: { attributes: ['fecha_registro'] }
            }]
        });

        res.status(201).json({ ok: true, rol: rolConPermisos });

    } catch (error) {
        console.error(error);
        res.status(500).json({ ok: false, msg: 'Error al crear el rol' });
    }
};

//Actualizar rol
const actualizarRol = async (req, res) => {
    const { id } = req.params;
    const { nombre, descripcion, permisos } = req.body;
    
    try {
        const rol = await Rol.findOne({ where: { id_rol: id, activo: true } });
        if (!rol) {
            return res.status(404).json({ ok: false, msg: 'Rol no encontrado' });
        }

        if (nombre && nombre !== rol.nombre) {
            const nombreExiste = await Rol.findOne({
                where: { nombre, activo: true, id_rol: { [Op.ne]: id } }
            });
            if (nombreExiste) {
                return res.status(400).json({ ok: false, msg: `Ya existe un rol con el nombre "${nombre}"` });
            }
        }

        if (permisos && permisos.length > 0) {
            const rolDuplicado = await verificarPermisosRepetidos(permisos, id);
            if (rolDuplicado) {
                return res.status(400).json({
                    ok: false,
                    msg: `Ya existe el rol "${rolDuplicado.nombre}" con exactamente los mismos permisos`
                });
            }
        }

        if (nombre) await rol.update({ nombre });
        if (descripcion) await rol.update({ descripcion });
        if (permisos !== undefined) {
            await RolPermiso.destroy({ where: { id_rol: id } });

            if (permisos.length > 0) {
                const rolPermisos = permisos.map(id_permiso => ({
                    id_rol: parseInt(id),
                    id_permiso
                }));
                await RolPermiso.bulkCreate(rolPermisos);
            }
        }

        const rolActualizado = await Rol.findByPk(id, {
            include: [{
                model: Permiso,
                as: 'permisos',
                attributes: ['id_permiso', 'nombre'],
                through: { attributes: ['fecha_registro'] }
            }]
        });

        res.json({ ok: true, rol: rolActualizado });

    } catch (error) {
        console.error(error);
        res.status(500).json({ ok: false, msg: 'Error al actualizar el rol' });
    }
};

//Eliminacion lógica del rol
const eliminarRol = async (req, res) => {
    const { id } = req.params;
    try {
        const rol = await Rol.findOne({ where: { id_rol: id, activo: true } });
        if (!rol) {
            return res.status(404).json({ ok: false, msg: 'Rol no encontrado' });
        }

        const usuariosConRol = await Usuario.count({ where: { id_rol: id } });
        if (usuariosConRol > 0) {
            return res.status(400).json({
                ok: false,
                msg: `No se puede eliminar el rol, hay ${usuariosConRol} usuario(s) asignado(s) a este rol`
            });
        }

        await rol.update({ activo: false });
        res.json({ ok: true, msg: 'Rol eliminado correctamente' });

    } catch (error) {
        console.error(error);
        res.status(500).json({ ok: false, msg: 'Error al eliminar el rol' });
    }
};

module.exports = {
    getRoles,
    getRolById,
    crearRol,
    actualizarRol,
    eliminarRol
};