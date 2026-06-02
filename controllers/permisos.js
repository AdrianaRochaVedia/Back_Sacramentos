const { Op } = require('sequelize');
const Permiso = require('../models/Permisos');
const RolPermiso = require('../models/RolPermiso');
const Modulo = require('../models/Modulo');

// Obtener permisos 
const getPermisos = async (req, res) => {
    try {
        const permisos = await Permiso.findAll({
            where: { activo: true },
            order: [['id_permiso', 'ASC']]
        });
        res.json({ ok: true, permisos });
    } catch (error) {
        console.error(error);
        res.status(500).json({ ok: false, msg: 'Error al obtener los permisos' });
    }
};

// Obtener permisos por ID
const getPermisoById = async (req, res) => {
    const { id } = req.params;
    try {
        const permiso = await Permiso.findOne({
            where: { id_permiso: id, activo: true }
        });

        if (!permiso) {
            return res.status(404).json({ ok: false, msg: 'Permiso no encontrado' });
        }
        res.json({ ok: true, permiso });

    } catch (error) {
        console.error(error);
        res.status(500).json({ ok: false, msg: 'Error al obtener el permiso' });
    }
};

const _normalizarNombre = (raw) =>
    raw?.trim().toUpperCase().replace(/\s+/g, '_') || '';

const crearPermiso = async (req, res) => {
    const nombre = _normalizarNombre(req.body.nombre);
    const { descripcion, id_modulo } = req.body;
    try {
        if (!nombre)
            return res.status(400).json({ ok: false, msg: 'El nombre del permiso es obligatorio' });

        if (!id_modulo)
            return res.status(400).json({ ok: false, msg: 'El módulo es obligatorio' });

        const modulo = await Modulo.findOne({ where: { id_modulo, activo: true } });
        if (!modulo)
            return res.status(400).json({ ok: false, msg: 'El módulo seleccionado no existe o está inactivo' });

        const existe = await Permiso.findOne({ where: { nombre, activo: true } });
        if (existe)
            return res.status(400).json({ ok: false, msg: `Ya existe un permiso con el nombre "${nombre}"` });

        const permiso = await Permiso.create({ nombre, descripcion, id_modulo });
        res.status(201).json({ ok: true, permiso });

    } catch (error) {
        console.error(error);
        res.status(500).json({ ok: false, msg: 'Error al crear el permiso' });
    }
};

const actualizarPermiso = async (req, res) => {
    const { id } = req.params;
    const nombre = req.body.nombre !== undefined ? _normalizarNombre(req.body.nombre) : undefined;
    const { descripcion, id_modulo } = req.body;
    try {
        const permiso = await Permiso.findOne({ where: { id_permiso: id, activo: true } });
        if (!permiso) {
            return res.status(404).json({ ok: false, msg: 'Permiso no encontrado' });
        }

        if (nombre !== undefined && nombre !== permiso.nombre) {
            if (!nombre)
                return res.status(400).json({ ok: false, msg: 'El nombre del permiso no puede estar vacío' });

            const nombreExiste = await Permiso.findOne({
                where: { nombre, activo: true, id_permiso: { [Op.ne]: id } }
            });
            if (nombreExiste) {
                return res.status(400).json({ ok: false, msg: `Ya existe un permiso con el nombre "${nombre}"` });
            }
        }

        if (id_modulo !== undefined) {
            if (!id_modulo)
                return res.status(400).json({ ok: false, msg: 'El módulo no puede estar vacío' });
            const modulo = await Modulo.findOne({ where: { id_modulo, activo: true } });
            if (!modulo)
                return res.status(400).json({ ok: false, msg: 'El módulo seleccionado no existe o está inactivo' });
        }

        const updates = {};
        if (nombre !== undefined) updates.nombre = nombre;
        if (descripcion !== undefined) updates.descripcion = descripcion;
        if (id_modulo !== undefined) updates.id_modulo = id_modulo;
        res.locals._instancia = permiso;
        await permiso.update(updates);
        res.json({ ok: true, permiso });

    } catch (error) {
        console.error(error);
        res.status(500).json({ ok: false, msg: 'Error al actualizar el permiso' });
    }
};

const eliminarPermiso = async (req, res) => {
    const { id } = req.params;
    try {
        const permiso = await Permiso.findOne({ where: { id_permiso: id, activo: true } });
        if (!permiso) {
            return res.status(404).json({ ok: false, msg: 'Permiso no encontrado' });
        }

        const rolesConPermiso = await RolPermiso.count({ where: { id_permiso: id } });
        if (rolesConPermiso > 0) {
            return res.status(400).json({
                ok: false,
                msg: `No se puede eliminar el permiso, está asignado a ${rolesConPermiso} rol(es)`
            });
        }

        res.locals._instancia = permiso;
        await permiso.update({ activo: false });
        res.json({ ok: true, msg: 'Permiso eliminado correctamente' });

    } catch (error) {
        console.error(error);
        res.status(500).json({ ok: false, msg: 'Error al eliminar el permiso' });
    }
};

module.exports = {
    getPermisos,
    getPermisoById,
    crearPermiso,
    actualizarPermiso,
    eliminarPermiso
};