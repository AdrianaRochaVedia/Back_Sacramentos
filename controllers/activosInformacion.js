const { Op } = require('sequelize');
const ActivoInformacion = require('../models/ActivoInformacion');
const Usuario           = require('../models/Usuario');

const _include = [{
  model:      Usuario,
  as:         'usuario',
  attributes: ['nombre', 'apellido_paterno', 'apellido_materno', 'email'],
}];

// GET /api/activos
const getActivos = async (req, res) => {
  try {
    const { nombre, tipo, page = 1, limit = 50 } = req.query;
    const where = { activo: true };

    if (nombre) where.nombre = { [Op.iLike]: `%${nombre}%` };
    if (tipo)   where.tipo   = tipo;

    const offset = (page - 1) * limit;
    const { count, rows } = await ActivoInformacion.findAndCountAll({
      where,
      order:   [['nombre', 'ASC']],
      limit:   Number(limit),
      offset,
      include: _include,
    });

    return res.json({
      ok:          true,
      activos:     rows,
      totalItems:  count,
      totalPages:  Math.ceil(count / limit),
      currentPage: Number(page),
    });
  } catch (error) {
    console.error('getActivos:', error);
    return res.status(500).json({ ok: false, msg: 'Error al obtener activos de información' });
  }
};

// GET /api/activos/:id
const getActivoById = async (req, res) => {
  try {
    const activo = await ActivoInformacion.findByPk(req.params.id, { include: _include });
    if (!activo || !activo.activo)
      return res.status(404).json({ ok: false, msg: 'Activo de información no encontrado' });
    return res.json({ ok: true, activo });
  } catch (error) {
    return res.status(500).json({ ok: false, msg: 'Error al obtener activo de información' });
  }
};

// POST /api/activos
const createActivo = async (req, res) => {
  try {
    const { nombre } = req.body;

    if (!nombre || !String(nombre).trim())
      return res.status(400).json({ ok: false, msg: 'El nombre del activo de información es obligatorio' });

    const existe = await ActivoInformacion.findOne({
      where: { nombre: { [Op.iLike]: nombre.trim() }, activo: true },
    });
    if (existe)
      return res.status(400).json({ ok: false, msg: `Ya existe un activo de información con el nombre "${nombre.trim()}"` });

    const activo = await ActivoInformacion.create({ ...req.body, nombre: nombre.trim(), usuario_id: req.uid });
    return res.status(201).json({ ok: true, msg: 'Activo de información creado correctamente', activo });
  } catch (error) {
    console.error('createActivo:', error);
    return res.status(400).json({ ok: false, msg: error.message || 'Error al crear activo de información' });
  }
};

// PUT /api/activos/:id
const updateActivo = async (req, res) => {
  try {
    const activo = await ActivoInformacion.findByPk(req.params.id);
    if (!activo || !activo.activo)
      return res.status(404).json({ ok: false, msg: 'Activo de información no encontrado' });

    const { nombre } = req.body;

    if (nombre !== undefined) {
      if (!String(nombre).trim())
        return res.status(400).json({ ok: false, msg: 'El nombre del activo no puede estar vacío' });

      const existe = await ActivoInformacion.findOne({
        where: {
          nombre:    { [Op.iLike]: nombre.trim() },
          activo:    true,
          id_activo: { [Op.ne]: activo.id_activo },
        },
      });
      if (existe)
        return res.status(400).json({ ok: false, msg: `Ya existe un activo de información con el nombre "${nombre.trim()}"` });
    }

    const campos = { ...req.body, updated_at: new Date() };
    if (nombre !== undefined) campos.nombre = nombre.trim();

    res.locals._instancia = activo;
    await activo.update(campos);
    return res.json({ ok: true, msg: 'Activo de información actualizado correctamente', activo });
  } catch (error) {
    console.error('updateActivo:', error);
    return res.status(400).json({ ok: false, msg: error.message || 'Error al actualizar activo de información' });
  }
};

// DELETE /api/activos/:id (soft delete)
const deleteActivo = async (req, res) => {
  try {
    const activo = await ActivoInformacion.findByPk(req.params.id);
    if (!activo) return res.status(404).json({ ok: false, msg: 'Activo de información no encontrado' });
    res.locals._instancia = activo;
    await activo.update({ activo: false });
    return res.json({ ok: true, msg: 'Activo de información eliminado correctamente' });
  } catch (error) {
    return res.status(500).json({ ok: false, msg: 'Error al eliminar activo de información' });
  }
};

module.exports = { getActivos, getActivoById, createActivo, updateActivo, deleteActivo };
