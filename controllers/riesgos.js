const { Op } = require('sequelize');
const MatrizRiesgo = require('../models/MatrizRiesgo');
 
// GET /api/riesgos
const getRiesgos = async (req, res) => {
  try {
    const { nivel, activo_info, page = 1, limit = 50 } = req.query;
    const where = { activo: true };
 
    if (nivel)      where.nivel_riesgo_inherente = nivel;
    if (activo_info) where.activo_info = { [Op.iLike]: `%${activo_info}%` };
 
    const offset = (page - 1) * limit;
    const { count, rows } = await MatrizRiesgo.findAndCountAll({
      where,
      order: [['numero', 'ASC']],
      limit: Number(limit),
      offset,
    });
 
    return res.json({
      ok: true,
      riesgos: rows,
      totalItems: count,
      totalPages: Math.ceil(count / limit),
      currentPage: Number(page),
    });
  } catch (error) {
    console.error('getRiesgos:', error);
    return res.status(500).json({ ok: false, msg: 'Error al obtener riesgos' });
  }
};
 
// GET /api/riesgos/:id
const getRiesgoById = async (req, res) => {
  try {
    const riesgo = await MatrizRiesgo.findByPk(req.params.id);
    if (!riesgo || !riesgo.activo)
      return res.status(404).json({ ok: false, msg: 'Riesgo no encontrado' });
    return res.json({ ok: true, riesgo });
  } catch (error) {
    return res.status(500).json({ ok: false, msg: 'Error al obtener riesgo' });
  }
};
 
// POST /api/riesgos
const createRiesgo = async (req, res) => {
  try {
    const riesgo = await MatrizRiesgo.create({
      ...req.body,
      usuario_id: req.uid,
    });
    return res.status(201).json({ ok: true, msg: 'Riesgo creado correctamente', riesgo });
  } catch (error) {
    console.error('createRiesgo:', error);
    return res.status(400).json({ ok: false, msg: error.message || 'Error al crear riesgo' });
  }
};
 
// PUT /api/riesgos/:id
const updateRiesgo = async (req, res) => {
  try {
    const riesgo = await MatrizRiesgo.findByPk(req.params.id);
    if (!riesgo || !riesgo.activo)
      return res.status(404).json({ ok: false, msg: 'Riesgo no encontrado' });
 
    await riesgo.update({ ...req.body, updated_at: new Date() });
    return res.json({ ok: true, msg: 'Riesgo actualizado correctamente', riesgo });
  } catch (error) {
    console.error('updateRiesgo:', error);
    return res.status(400).json({ ok: false, msg: error.message || 'Error al actualizar riesgo' });
  }
};
 
// DELETE /api/riesgos/:id  (soft delete)
const deleteRiesgo = async (req, res) => {
  try {
    const riesgo = await MatrizRiesgo.findByPk(req.params.id);
    if (!riesgo) return res.status(404).json({ ok: false, msg: 'Riesgo no encontrado' });
    await riesgo.update({ activo: false });
    return res.json({ ok: true, msg: 'Riesgo eliminado correctamente' });
  } catch (error) {
    return res.status(500).json({ ok: false, msg: 'Error al eliminar riesgo' });
  }
};
 
module.exports = { getRiesgos, getRiesgoById, createRiesgo, updateRiesgo, deleteRiesgo };