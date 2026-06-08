const { Op } = require('sequelize');
const VulnerabilidadAmenaza = require('../models/VulnerabilidadAmenaza');
const Usuario               = require('../models/Usuario');

const _include = [{
  model:      Usuario,
  as:         'usuario',
  attributes: ['nombre', 'apellido_paterno', 'apellido_materno', 'email'],
}];

// GET /api/vulnerabilidades
const getVulnerabilidades = async (req, res) => {
  try {
    const { nombre, tipo, page = 1, limit = 50 } = req.query;
    const where = { activo: true };

    if (nombre) where.nombre = { [Op.iLike]: `%${nombre}%` };
    if (tipo)   where.tipo   = tipo; // 'vulnerabilidad' | 'amenaza'

    const offset = (page - 1) * limit;
    const { count, rows } = await VulnerabilidadAmenaza.findAndCountAll({
      where,
      order:   [['nombre', 'ASC']],
      limit:   Number(limit),
      offset,
      include: _include,
    });

    return res.json({
      ok:              true,
      vulnerabilidades: rows,
      totalItems:      count,
      totalPages:      Math.ceil(count / limit),
      currentPage:     Number(page),
    });
  } catch (error) {
    console.error('getVulnerabilidades:', error);
    return res.status(500).json({ ok: false, msg: 'Error al obtener vulnerabilidades/amenazas' });
  }
};

// GET /api/vulnerabilidades/:id
const getVulnerabilidadById = async (req, res) => {
  try {
    const vuln = await VulnerabilidadAmenaza.findByPk(req.params.id, { include: _include });
    if (!vuln || !vuln.activo)
      return res.status(404).json({ ok: false, msg: 'Vulnerabilidad/amenaza no encontrada' });
    return res.json({ ok: true, vulnerabilidad: vuln });
  } catch (error) {
    return res.status(500).json({ ok: false, msg: 'Error al obtener vulnerabilidad/amenaza' });
  }
};

// POST /api/vulnerabilidades
const createVulnerabilidad = async (req, res) => {
  try {
    const { nombre } = req.body;

    if (!nombre || !String(nombre).trim())
      return res.status(400).json({ ok: false, msg: 'El nombre de la vulnerabilidad/amenaza es obligatorio' });

    const existe = await VulnerabilidadAmenaza.findOne({
      where: { nombre: { [Op.iLike]: nombre.trim() }, activo: true },
    });
    if (existe)
      return res.status(400).json({ ok: false, msg: `Ya existe una vulnerabilidad/amenaza con el nombre "${nombre.trim()}"` });

    const vuln = await VulnerabilidadAmenaza.create({ ...req.body, nombre: nombre.trim(), usuario_id: req.uid });
    return res.status(201).json({ ok: true, msg: 'Vulnerabilidad/amenaza creada correctamente', vulnerabilidad: vuln });
  } catch (error) {
    console.error('createVulnerabilidad:', error);
    return res.status(400).json({ ok: false, msg: error.message || 'Error al crear vulnerabilidad/amenaza' });
  }
};

// PUT /api/vulnerabilidades/:id
const updateVulnerabilidad = async (req, res) => {
  try {
    const vuln = await VulnerabilidadAmenaza.findByPk(req.params.id);
    if (!vuln || !vuln.activo)
      return res.status(404).json({ ok: false, msg: 'Vulnerabilidad/amenaza no encontrada' });

    const { nombre } = req.body;

    if (nombre !== undefined) {
      if (!String(nombre).trim())
        return res.status(400).json({ ok: false, msg: 'El nombre no puede estar vacío' });

      const existe = await VulnerabilidadAmenaza.findOne({
        where: {
          nombre:           { [Op.iLike]: nombre.trim() },
          activo:           true,
          id_vulnerabilidad: { [Op.ne]: vuln.id_vulnerabilidad },
        },
      });
      if (existe)
        return res.status(400).json({ ok: false, msg: `Ya existe una vulnerabilidad/amenaza con el nombre "${nombre.trim()}"` });
    }

    const campos = { ...req.body, updated_at: new Date() };
    if (nombre !== undefined) campos.nombre = nombre.trim();

    res.locals._instancia = vuln;
    await vuln.update(campos);
    return res.json({ ok: true, msg: 'Vulnerabilidad/amenaza actualizada correctamente', vulnerabilidad: vuln });
  } catch (error) {
    console.error('updateVulnerabilidad:', error);
    return res.status(400).json({ ok: false, msg: error.message || 'Error al actualizar vulnerabilidad/amenaza' });
  }
};

// DELETE /api/vulnerabilidades/:id (soft delete)
const deleteVulnerabilidad = async (req, res) => {
  try {
    const vuln = await VulnerabilidadAmenaza.findByPk(req.params.id);
    if (!vuln) return res.status(404).json({ ok: false, msg: 'Vulnerabilidad/amenaza no encontrada' });
    res.locals._instancia = vuln;
    await vuln.update({ activo: false });
    return res.json({ ok: true, msg: 'Vulnerabilidad/amenaza eliminada correctamente' });
  } catch (error) {
    return res.status(500).json({ ok: false, msg: 'Error al eliminar vulnerabilidad/amenaza' });
  }
};

module.exports = {
  getVulnerabilidades,
  getVulnerabilidadById,
  createVulnerabilidad,
  updateVulnerabilidad,
  deleteVulnerabilidad,
};
