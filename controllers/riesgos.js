const { Op }                = require('sequelize');
const { sequelize }         = require('../database/config');
const Riesgo                = require('../models/Riesgo');
const ActivoInformacion     = require('../models/ActivoInformacion');
const VulnerabilidadAmenaza = require('../models/VulnerabilidadAmenaza');
const Control               = require('../models/Control');
const Usuario               = require('../models/Usuario');

const _riesgoInclude = [
  {
    model:      ActivoInformacion,
    as:         'activoInfo',
    attributes: ['id_activo', 'nombre', 'tipo', 'propietario'],
  },
  {
    model:      VulnerabilidadAmenaza,
    as:         'vulnerabilidades',
    attributes: ['id_vulnerabilidad', 'nombre', 'tipo'],
    through:    { attributes: [] },
  },
  {
    model:      Control,
    as:         'controles',
    where:      { activo: true },
    required:   false,
    attributes: { exclude: ['riesgo_id', 'usuario_id'] },
  },
  {
    model:      Usuario,
    as:         'usuario',
    attributes: ['nombre', 'apellido_paterno', 'apellido_materno', 'email'],
  },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

const _nivelTexto = (valor) => {
  if (valor <= 4)  return 'Bajo';
  if (valor <= 9)  return 'Moderado';
  if (valor <= 16) return 'Alto';
  return 'Extremo';
};

const _siguienteNumero = async (t) => {
  const max = await Riesgo.max('numero', { transaction: t });
  return (max || 0) + 1;
};

const _validarRango = (valor, nombre) => {
  const n = Number(valor);
  if (!Number.isInteger(n) || n < 1 || n > 4)
    return `${nombre} debe ser un número entero entre 1 y 4`;
  return null;
};

// Comprueba si ya existe un riesgo activo con el mismo activo + mismo conjunto de vulnerabilidades
const _existeDuplicadoRiesgo = async (activo_id, vulnerabilidad_ids, excluirId = null, t = null) => {
  const where = { activo_id, activo: true };
  if (excluirId) where.id_riesgo = { [Op.ne]: excluirId };

  const candidatos = await Riesgo.findAll({
    where,
    include: [{
      model:   VulnerabilidadAmenaza,
      as:      'vulnerabilidades',
      through: { attributes: [] },
    }],
    transaction: t,
  });

  const idsNuevos = [...vulnerabilidad_ids].map(Number).sort((a, b) => a - b).join(',');
  return candidatos.some(r => {
    const idsExistentes = r.vulnerabilidades
      .map(v => v.id_vulnerabilidad)
      .sort((a, b) => a - b)
      .join(',');
    return idsExistentes === idsNuevos;
  });
};

// ── GET /api/riesgos ──────────────────────────────────────────────────────────
const getRiesgos = async (req, res) => {
  try {
    const { nivel, activo_id, en_matriz, page = 1, limit = 50 } = req.query;
    const where = { activo: true };

    if (activo_id)              where.activo_id = activo_id;
    if (en_matriz !== undefined) where.en_matriz = en_matriz === 'true';

    const offset = (page - 1) * limit;
    const { count, rows } = await Riesgo.findAndCountAll({
      where,
      order:   [['numero', 'ASC']],
      limit:   Number(limit),
      offset,
      include: _riesgoInclude,
    });

    // nivel_riesgo_inherente es VIRTUAL, no se puede filtrar en SQL
    const riesgos = nivel
      ? rows.filter(r => r.nivel_riesgo_inherente === nivel)
      : rows;

    return res.json({
      ok: true,
      riesgos,
      totalItems:  count,
      totalPages:  Math.ceil(count / limit),
      currentPage: Number(page),
    });
  } catch (error) {
    console.error('getRiesgos:', error);
    return res.status(500).json({ ok: false, msg: 'Error al obtener riesgos' });
  }
};

// ── GET /api/riesgos/:id ──────────────────────────────────────────────────────
const getRiesgoById = async (req, res) => {
  try {
    const riesgo = await Riesgo.findByPk(req.params.id, { include: _riesgoInclude });
    if (!riesgo || !riesgo.activo)
      return res.status(404).json({ ok: false, msg: 'Riesgo no encontrado' });
    return res.json({ ok: true, riesgo });
  } catch (error) {
    return res.status(500).json({ ok: false, msg: 'Error al obtener riesgo' });
  }
};

// ── POST /api/riesgos ─────────────────────────────────────────────────────────
const createRiesgo = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const {
      activo_id,
      vulnerabilidad_ids = [],
      consecuencia,
      probabilidad_inherente,
      impacto_inherente,
      tratamiento,
    } = req.body;

    // Campos requeridos
    if (!activo_id)
      return _rollback(t, res, 'El activo de información es obligatorio');
    if (!consecuencia || !String(consecuencia).trim())
      return _rollback(t, res, 'La consecuencia es obligatoria');
    if (probabilidad_inherente === undefined || probabilidad_inherente === null)
      return _rollback(t, res, 'La probabilidad inherente es obligatoria');
    if (impacto_inherente === undefined || impacto_inherente === null)
      return _rollback(t, res, 'El impacto inherente es obligatorio');

    // Rangos 1-4
    const errProb = _validarRango(probabilidad_inherente, 'La probabilidad inherente');
    if (errProb) return _rollback(t, res, errProb);
    const errImp = _validarRango(impacto_inherente, 'El impacto inherente');
    if (errImp) return _rollback(t, res, errImp);

    // Al menos una vulnerabilidad/amenaza
    if (!Array.isArray(vulnerabilidad_ids) || vulnerabilidad_ids.length === 0)
      return _rollback(t, res, 'Debe seleccionar al menos una vulnerabilidad o amenaza');

    // Activo de información existe y está activo
    const activo = await ActivoInformacion.findByPk(activo_id, { transaction: t });
    if (!activo || !activo.activo)
      return _rollback(t, res, 'Activo de información no válido o inactivo');

    // Vulnerabilidades existen y están activas
    const vulns = await VulnerabilidadAmenaza.findAll({
      where: { id_vulnerabilidad: { [Op.in]: vulnerabilidad_ids }, activo: true },
      transaction: t,
    });
    if (vulns.length !== vulnerabilidad_ids.length)
      return _rollback(t, res, 'Una o más vulnerabilidades/amenazas no son válidas o están inactivas');

    // Duplicado: mismo activo + mismas vulnerabilidades
    const duplicado = await _existeDuplicadoRiesgo(activo_id, vulnerabilidad_ids, null, t);
    if (duplicado)
      return _rollback(t, res, 'Ya existe un riesgo registrado con este activo y las mismas vulnerabilidades/amenazas');

    const numero = await _siguienteNumero(t);
    const riesgo = await Riesgo.create(
      { numero, activo_id, consecuencia: consecuencia.trim(), probabilidad_inherente, impacto_inherente, tratamiento, usuario_id: req.uid },
      { transaction: t }
    );

    await riesgo.setVulnerabilidades(vulnerabilidad_ids, { transaction: t });
    await t.commit();

    const riesgoCompleto = await Riesgo.findByPk(riesgo.id_riesgo, { include: _riesgoInclude });
    return res.status(201).json({ ok: true, msg: 'Riesgo creado correctamente', riesgo: riesgoCompleto });
  } catch (error) {
    await t.rollback();
    console.error('createRiesgo:', error);
    return res.status(400).json({ ok: false, msg: error.message || 'Error al crear riesgo' });
  }
};

// ── PUT /api/riesgos/:id ──────────────────────────────────────────────────────
const updateRiesgo = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const riesgo = await Riesgo.findByPk(req.params.id, { transaction: t });
    if (!riesgo || !riesgo.activo)
      return _rollback(t, res, 'Riesgo no encontrado', 404);
    if (riesgo.en_matriz)
      return _rollback(t, res, 'No se puede editar un riesgo ya publicado en la matriz');

    const { vulnerabilidad_ids, consecuencia, probabilidad_inherente, impacto_inherente, ...resto } = req.body;

    // Rangos solo si vienen en el body
    if (probabilidad_inherente !== undefined) {
      const err = _validarRango(probabilidad_inherente, 'La probabilidad inherente');
      if (err) return _rollback(t, res, err);
    }
    if (impacto_inherente !== undefined) {
      const err = _validarRango(impacto_inherente, 'El impacto inherente');
      if (err) return _rollback(t, res, err);
    }
    if (consecuencia !== undefined && !String(consecuencia).trim())
      return _rollback(t, res, 'La consecuencia no puede estar vacía');

    // Validar y detectar duplicado si cambian activo o vulnerabilidades
    const nuevoActivoId    = resto.activo_id ?? riesgo.activo_id;
    const nuevasVulnIds    = Array.isArray(vulnerabilidad_ids) ? vulnerabilidad_ids : null;

    if (nuevasVulnIds !== null) {
      if (nuevasVulnIds.length === 0)
        return _rollback(t, res, 'Debe seleccionar al menos una vulnerabilidad o amenaza');

      const vulns = await VulnerabilidadAmenaza.findAll({
        where: { id_vulnerabilidad: { [Op.in]: nuevasVulnIds }, activo: true },
        transaction: t,
      });
      if (vulns.length !== nuevasVulnIds.length)
        return _rollback(t, res, 'Una o más vulnerabilidades/amenazas no son válidas o están inactivas');

      const duplicado = await _existeDuplicadoRiesgo(nuevoActivoId, nuevasVulnIds, riesgo.id_riesgo, t);
      if (duplicado)
        return _rollback(t, res, 'Ya existe otro riesgo con este activo y las mismas vulnerabilidades/amenazas');
    }

    res.locals._instancia = riesgo;
    const campos = { ...resto, updated_at: new Date() };
    if (consecuencia !== undefined) campos.consecuencia = consecuencia.trim();
    if (probabilidad_inherente !== undefined) campos.probabilidad_inherente = probabilidad_inherente;
    if (impacto_inherente !== undefined) campos.impacto_inherente = impacto_inherente;

    await riesgo.update(campos, { transaction: t });
    if (nuevasVulnIds !== null)
      await riesgo.setVulnerabilidades(nuevasVulnIds, { transaction: t });

    await t.commit();

    const riesgoCompleto = await Riesgo.findByPk(riesgo.id_riesgo, { include: _riesgoInclude });
    return res.json({ ok: true, msg: 'Riesgo actualizado correctamente', riesgo: riesgoCompleto });
  } catch (error) {
    await t.rollback();
    console.error('updateRiesgo:', error);
    return res.status(400).json({ ok: false, msg: error.message || 'Error al actualizar riesgo' });
  }
};

// ── PUT /api/riesgos/:id/publicar ─────────────────────────────────────────────
const publicarRiesgo = async (req, res) => {
  try {
    const riesgo = await Riesgo.findByPk(req.params.id, { include: _riesgoInclude });
    if (!riesgo || !riesgo.activo)
      return res.status(404).json({ ok: false, msg: 'Riesgo no encontrado' });
    if (riesgo.en_matriz)
      return res.status(400).json({ ok: false, msg: 'El riesgo ya está publicado en la matriz' });

    const controles = riesgo.controles || [];
    if (controles.length === 0)
      return res.status(400).json({ ok: false, msg: 'Debe registrar al menos un control antes de publicar en la matriz' });

    // Controles con descripción duplicada (case-insensitive)
    const descripciones = controles.map(c => c.descripcion.trim().toLowerCase());
    const duplicado = descripciones.find((d, i) => descripciones.indexOf(d) !== i);
    if (duplicado)
      return res.status(400).json({
        ok:  false,
        msg: `Existen controles con descripción duplicada: "${controles.find(c => c.descripcion.trim().toLowerCase() === duplicado).descripcion}"`,
      });

    const inherente = riesgo.probabilidad_inherente * riesgo.impacto_inherente;
    const invalido  = controles.find(c => (c.probabilidad_residual * c.impacto_residual) > inherente);
    if (invalido) {
      return res.status(400).json({
        ok:  false,
        msg: `El control "${invalido.descripcion}" tiene riesgo residual mayor al inherente (${_nivelTexto(inherente)})`,
      });
    }

    res.locals._instancia = riesgo;
    await riesgo.update({ en_matriz: true });
    return res.json({ ok: true, msg: 'Riesgo publicado en la matriz correctamente', riesgo });
  } catch (error) {
    console.error('publicarRiesgo:', error);
    return res.status(500).json({ ok: false, msg: 'Error al publicar riesgo en la matriz' });
  }
};

// ── DELETE /api/riesgos/:id (soft delete) ─────────────────────────────────────
const deleteRiesgo = async (req, res) => {
  try {
    const riesgo = await Riesgo.findByPk(req.params.id);
    if (!riesgo) return res.status(404).json({ ok: false, msg: 'Riesgo no encontrado' });
    if (riesgo.en_matriz)
      return res.status(400).json({ ok: false, msg: 'No se puede eliminar un riesgo publicado en la matriz' });
    res.locals._instancia = riesgo;
    await riesgo.update({ activo: false });
    return res.json({ ok: true, msg: 'Riesgo eliminado correctamente' });
  } catch (error) {
    return res.status(500).json({ ok: false, msg: 'Error al eliminar riesgo' });
  }
};

// ── Util interno ──────────────────────────────────────────────────────────────
const _rollback = async (t, res, msg, status = 400) => {
  await t.rollback();
  return res.status(status).json({ ok: false, msg });
};

module.exports = {
  getRiesgos,
  getRiesgoById,
  createRiesgo,
  updateRiesgo,
  publicarRiesgo,
  deleteRiesgo,
};
