const { Op } = require('sequelize');
const Modulo = require('../models/Modulo');
const Permiso = require('../models/Permisos');

const getModulos = async (req, res) => {
    try {
        const modulos = await Modulo.findAll({
            where: { activo: true },
            include: [{ model: Permiso, as: 'permisos', attributes: ['id_permiso', 'nombre', 'descripcion'], where: { activo: true }, required: false }],
            order: [['id_modulo', 'ASC']]
        });
        res.json({ ok: true, modulos });
    } catch (error) {
        console.error(error);
        res.status(500).json({ ok: false, msg: 'Error al obtener los módulos' });
    }
};

const getModuloById = async (req, res) => {
    const { id } = req.params;
    try {
        const modulo = await Modulo.findOne({
            where: { id_modulo: id, activo: true },
            include: [{ model: Permiso, as: 'permisos', attributes: ['id_permiso', 'nombre', 'descripcion'], where: { activo: true }, required: false }]
        });
        if (!modulo) {
            return res.status(404).json({ ok: false, msg: 'Módulo no encontrado' });
        }
        res.json({ ok: true, modulo });
    } catch (error) {
        console.error(error);
        res.status(500).json({ ok: false, msg: 'Error al obtener el módulo' });
    }
};

const crearModulo = async (req, res) => {
    const { nombre, descripcion, ruta, icono } = req.body;
    try {
        const existe = await Modulo.findOne({ where: { nombre, activo: true } });
        if (existe) {
            return res.status(400).json({ ok: false, msg: `Ya existe un módulo con el nombre "${nombre}"` });
        }
        const modulo = await Modulo.create({ nombre, descripcion, ruta, icono });
        res.status(201).json({ ok: true, modulo });
    } catch (error) {
        console.error(error);
        res.status(500).json({ ok: false, msg: 'Error al crear el módulo' });
    }
};

const actualizarModulo = async (req, res) => {
    const { id } = req.params;
    const { nombre, descripcion, ruta, icono } = req.body;
    try {
        const modulo = await Modulo.findOne({ where: { id_modulo: id, activo: true } });
        if (!modulo) {
            return res.status(404).json({ ok: false, msg: 'Módulo no encontrado' });
        }
        if (nombre && nombre !== modulo.nombre) {
            const nombreExiste = await Modulo.findOne({
                where: { nombre, activo: true, id_modulo: { [Op.ne]: id } }
            });
            if (nombreExiste) {
                return res.status(400).json({ ok: false, msg: `Ya existe un módulo con el nombre "${nombre}"` });
            }
        }
        const updates = {};
        if (nombre !== undefined) updates.nombre = nombre;
        if (descripcion !== undefined) updates.descripcion = descripcion;
        if (ruta !== undefined) updates.ruta = ruta;
        if (icono !== undefined) updates.icono = icono;
        await modulo.update(updates);
        res.json({ ok: true, modulo });
    } catch (error) {
        console.error(error);
        res.status(500).json({ ok: false, msg: 'Error al actualizar el módulo' });
    }
};

const eliminarModulo = async (req, res) => {
    const { id } = req.params;
    try {
        const modulo = await Modulo.findOne({ where: { id_modulo: id, activo: true } });
        if (!modulo) {
            return res.status(404).json({ ok: false, msg: 'Módulo no encontrado' });
        }
        const permisosAsignados = await Permiso.count({ where: { id_modulo: id, activo: true } });
        if (permisosAsignados > 0) {
            return res.status(400).json({
                ok: false,
                msg: `No se puede eliminar el módulo, tiene ${permisosAsignados} permiso(s) asignado(s)`
            });
        }
        await modulo.update({ activo: false });
        res.json({ ok: true, msg: 'Módulo eliminado correctamente' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ ok: false, msg: 'Error al eliminar el módulo' });
    }
};

module.exports = {
    getModulos,
    getModuloById,
    crearModulo,
    actualizarModulo,
    eliminarModulo
};
