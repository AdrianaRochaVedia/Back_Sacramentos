const { Op }    = require('sequelize');
const Riesgo    = require('../models/Riesgo');
const Control   = require('../models/Control');
const Usuario   = require('../models/Usuario');

const _include = [{
  model:      Usuario,
  as:         'usuario',
  attributes: ['nombre', 'apellido_paterno', 'apellido_materno', 'email'],
}];

const _validarRango = (valor, nombre) => {
  const n = Number(valor);
  if (!Number.isInteger(n) || n < 1 || n > 4)
    return `${nombre} debe ser un número entero entre 1 y 4`;
  return null;
};

// GET /api/riesgos/:id/controles
const getControles = async (req, res) => {
  try {
    const riesgo = await Riesgo.findByPk(req.params.id);
    if (!riesgo || !riesgo.activo)
      return res.status(404).json({ ok: false, msg: 'Riesgo no encontrado' });

    const controles = await Control.findAll({
      where:   { riesgo_id: req.params.id, activo: true },
      include: _include,
      order:   [['created_at', 'ASC']],
    });

    return res.json({ ok: true, controles });
  } catch (error) {
    console.error('getControles:', error);
    return res.status(500).json({ ok: false, msg: 'Error al obtener controles' });
  }
};

// POST /api/riesgos/:id/controles
const createControl = async (req, res) => {
  try {
    const riesgo = await Riesgo.findByPk(req.params.id);
    if (!riesgo || !riesgo.activo)
      return res.status(404).json({ ok: false, msg: 'Riesgo no encontrado' });
    if (riesgo.en_matriz)
      return res.status(400).json({ ok: false, msg: 'No se pueden agregar controles a un riesgo ya publicado en la matriz' });

    const { descripcion, nivel_efectividad, probabilidad_residual, impacto_residual } = req.body;

    // Campos requeridos
    if (!descripcion || !String(descripcion).trim())
      return res.status(400).json({ ok: false, msg: 'La descripción del control es obligatoria' });
    if (!nivel_efectividad)
      return res.status(400).json({ ok: false, msg: 'El nivel de efectividad es obligatorio' });
    if (!['Manual', 'Automático', 'Semi automático'].includes(nivel_efectividad))
      return res.status(400).json({ ok: false, msg: 'El nivel de efectividad debe ser Manual, Automático o Semi automático' });
    if (probabilidad_residual === undefined || probabilidad_residual === null)
      return res.status(400).json({ ok: false, msg: 'La probabilidad residual es obligatoria' });
    if (impacto_residual === undefined || impacto_residual === null)
      return res.status(400).json({ ok: false, msg: 'El impacto residual es obligatorio' });

    // Rangos 1-4
    const errProb = _validarRango(probabilidad_residual, 'La probabilidad residual');
    if (errProb) return res.status(400).json({ ok: false, msg: errProb });
    const errImp = _validarRango(impacto_residual, 'El impacto residual');
    if (errImp) return res.status(400).json({ ok: false, msg: errImp });

    // Residual no puede superar el inherente
    const inherente = riesgo.probabilidad_inherente * riesgo.impacto_inherente;
    const residual  = Number(probabilidad_residual) * Number(impacto_residual);
    if (residual > inherente)
      return res.status(400).json({
        ok:  false,
        msg: `El riesgo residual (${residual}) no puede ser mayor al riesgo inherente (${inherente})`,
      });

    // Duplicado: misma descripción para el mismo riesgo
    const existe = await Control.findOne({
      where: {
        riesgo_id:   riesgo.id_riesgo,
        descripcion: { [Op.iLike]: descripcion.trim() },
        activo:      true,
      },
    });
    if (existe)
      return res.status(400).json({ ok: false, msg: 'Ya existe un control con esa descripción para este riesgo' });

    const control = await Control.create({
      ...req.body,
      descripcion: descripcion.trim(),
      riesgo_id:   riesgo.id_riesgo,
      usuario_id:  req.uid,
    });

    return res.status(201).json({ ok: true, msg: 'Control registrado correctamente', control });
  } catch (error) {
    console.error('createControl:', error);
    return res.status(400).json({ ok: false, msg: error.message || 'Error al registrar control' });
  }
};

// PUT /api/riesgos/:id/controles/:id_control
const updateControl = async (req, res) => {
  try {
    const riesgo = await Riesgo.findByPk(req.params.id);
    if (!riesgo || !riesgo.activo)
      return res.status(404).json({ ok: false, msg: 'Riesgo no encontrado' });
    if (riesgo.en_matriz)
      return res.status(400).json({ ok: false, msg: 'No se pueden editar controles de un riesgo ya publicado en la matriz' });

    const control = await Control.findOne({
      where: { id_control: req.params.id_control, riesgo_id: req.params.id, activo: true },
    });
    if (!control)
      return res.status(404).json({ ok: false, msg: 'Control no encontrado' });

    const { descripcion, nivel_efectividad } = req.body;
    const probabilidad_residual = req.body.probabilidad_residual ?? control.probabilidad_residual;
    const impacto_residual      = req.body.impacto_residual      ?? control.impacto_residual;

    // Validaciones solo si el campo viene en el body
    if (descripcion !== undefined && !String(descripcion).trim())
      return res.status(400).json({ ok: false, msg: 'La descripción no puede estar vacía' });
    if (nivel_efectividad !== undefined && !['Manual', 'Automático', 'Semi automático'].includes(nivel_efectividad))
      return res.status(400).json({ ok: false, msg: 'El nivel de efectividad debe ser Manual, Automático o Semi automático' });

    const errProb = _validarRango(probabilidad_residual, 'La probabilidad residual');
    if (errProb) return res.status(400).json({ ok: false, msg: errProb });
    const errImp = _validarRango(impacto_residual, 'El impacto residual');
    if (errImp) return res.status(400).json({ ok: false, msg: errImp });

    // Residual no puede superar el inherente
    const inherente = riesgo.probabilidad_inherente * riesgo.impacto_inherente;
    const residual  = Number(probabilidad_residual) * Number(impacto_residual);
    if (residual > inherente)
      return res.status(400).json({
        ok:  false,
        msg: `El riesgo residual (${residual}) no puede ser mayor al riesgo inherente (${inherente})`,
      });

    // Duplicado: misma descripción en otro control del mismo riesgo
    if (descripcion !== undefined) {
      const existe = await Control.findOne({
        where: {
          riesgo_id:   riesgo.id_riesgo,
          descripcion: { [Op.iLike]: descripcion.trim() },
          activo:      true,
          id_control:  { [Op.ne]: control.id_control },
        },
      });
      if (existe)
        return res.status(400).json({ ok: false, msg: 'Ya existe otro control con esa descripción para este riesgo' });
    }

    res.locals._instancia = control;
    const campos = { ...req.body, updated_at: new Date() };
    if (descripcion !== undefined) campos.descripcion = descripcion.trim();

    await control.update(campos);
    return res.json({ ok: true, msg: 'Control actualizado correctamente', control });
  } catch (error) {
    console.error('updateControl:', error);
    return res.status(400).json({ ok: false, msg: error.message || 'Error al actualizar control' });
  }
};

// DELETE /api/riesgos/:id/controles/:id_control (soft delete)
const deleteControl = async (req, res) => {
  try {
    const riesgo = await Riesgo.findByPk(req.params.id);
    if (!riesgo || !riesgo.activo)
      return res.status(404).json({ ok: false, msg: 'Riesgo no encontrado' });
    if (riesgo.en_matriz)
      return res.status(400).json({ ok: false, msg: 'No se pueden eliminar controles de un riesgo publicado en la matriz' });

    const control = await Control.findOne({
      where: { id_control: req.params.id_control, riesgo_id: req.params.id },
    });
    if (!control) return res.status(404).json({ ok: false, msg: 'Control no encontrado' });

    res.locals._instancia = control;
    await control.update({ activo: false });
    return res.json({ ok: true, msg: 'Control eliminado correctamente' });
  } catch (error) {
    return res.status(500).json({ ok: false, msg: 'Error al eliminar control' });
  }
};

module.exports = { getControles, createControl, updateControl, deleteControl };
