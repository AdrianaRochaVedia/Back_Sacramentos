const { Router } = require('express');
const { Op } = require('sequelize');
const Auditoria = require('../models/Auditoria');
const Usuario = require('../models/Usuario'); // <--- IMPORTANTE agregado
const { validarJWT } = require('../middlewares/validar-jwt');

const router = Router();

// Utilidades de fechas
function toDate(value) {
  if (!value) return null;
  const d = new Date(value);
  return isNaN(d.getTime()) ? null : d;
}

function daysAgo(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}

/**
 * GET /api/auditoria
 */
router.get('/', validarJWT, async (req, res) => {
  try {
    let {
      start_date, end_date,
      user_name, http_method, http_status_code,
      application_name, url, user_agent,
      min_duration, max_duration,
      ip_address, correlation_id,
      has_exception,
      page = 1, limit = 50,
    } = req.query;

    // Normalizaciones básicas
    start_date = toDate(start_date);
    end_date = toDate(end_date);
    const now = new Date();

    // Defaults inteligentes de rango de fechas
    if (!start_date && !end_date) {
      // Últimos 7 días
      start_date = daysAgo(7);
      end_date = now;
    } else if (start_date && !end_date) {
      end_date = now;
    } else if (!start_date && end_date) {
      const base = new Date(end_date.getTime());
      base.setDate(base.getDate() - 7);
      start_date = base;
    }

    // Construcción de filtros
    const where = {};
    if (start_date || end_date) {
      where.fecha_inicio = {};
      if (start_date) where.fecha_inicio[Op.gte] = start_date;
      if (end_date)   where.fecha_inicio[Op.lte] = end_date;
    }

    if (user_name && user_name.trim()) {
      where.username = { [Op.iLike]: `%${user_name.trim()}%` };
    }

    if (http_method && http_method.trim()) {
      where.http_method = http_method.trim().toUpperCase();
    }

    if (http_status_code) {
      const code = Number(http_status_code);
      if (!Number.isNaN(code)) where.http_status = code;
    }

    if (application_name && application_name.trim()) {
      where.application_name = { [Op.iLike]: `%${application_name.trim()}%` };
    }

    if (url && url.trim()) {
      where.url = { [Op.iLike]: `%${url.trim()}%` };
    }

    if (user_agent && user_agent.trim()) {
      where.user_agent = { [Op.iLike]: `%${user_agent.trim()}%` };
    }

    if (ip_address && ip_address.trim()) {
      where.ip_address = ip_address.trim();
    }

    if (correlation_id && correlation_id.trim()) {
      where.correlation_id = correlation_id.trim();
    }

    if (min_duration || max_duration) {
      where.duracion_ms = {};
      const min = Number(min_duration);
      const max = Number(max_duration);
      if (!Number.isNaN(min)) where.duracion_ms[Op.gte] = min;
      if (!Number.isNaN(max)) where.duracion_ms[Op.lte] = max;
    }

    if (typeof has_exception !== 'undefined') {
      const v = String(has_exception).toLowerCase();
      if (v === 'true' || v === 'false') where.has_exception = (v === 'true');
    }

    const pageNum = Math.max(parseInt(page, 10) || 1, 1);
    const perPage = Math.min(parseInt(limit, 10) || 50, 500);
    const offset  = (pageNum - 1) * perPage;

    // Consulta principal
    const { rows, count } = await Auditoria.findAndCountAll({
      where,
      order: [['fecha_inicio', 'DESC']],
      limit: perPage,
      offset,
    });

    // Enriquecer logs con nombre_usuario sin modificar BD
    const dataEnriched = await Promise.all(
      rows.map(async (r) => {
        let nombre_usuario = null;

        if (r.username) {
          const user = await Usuario.findOne({ where: { email: r.username } });

          if (user) {
            nombre_usuario = [
              user.nombre,
              user.apellido_paterno,
              user.apellido_materno
            ]
            .filter(Boolean)
            .join(" ");
          }
        }

        return {
          ...r.dataValues,
          nombre_usuario,  // <------- agregado aquí
        };
      })
    );

    // Respuesta final
    res.json({
      ok: true,
      total: count,
      page: pageNum,
      limit: perPage,
      data: dataEnriched,
      applied_filters: {
        start_date: start_date?.toISOString(),
        end_date: end_date?.toISOString(),
        user_name: user_name || null,
        http_method: where.http_method || null,
        http_status_code: where.http_status || null,
        application_name: application_name || null,
        url: url || null,
        user_agent: user_agent || null,
        min_duration: min_duration || null,
        max_duration: max_duration || null,
        ip_address: ip_address || null,
        correlation_id: correlation_id || null,
        has_exception: (typeof where.has_exception === 'boolean') ? where.has_exception : null
      }
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ ok: false, msg: 'Error listando auditorías' });
  }
});

module.exports = router;