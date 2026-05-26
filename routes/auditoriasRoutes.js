const { Router } = require('express');
const { Op } = require('sequelize');
const AuditoriaAplicacion = require('../models/AuditoriaAplicacion');
const AuditoriaSeguridad  = require('../models/AuditoriaSeguridad');
const Usuario             = require('../models/Usuario');
const { validarJWT }      = require('../middlewares/validar-jwt');
const { validarPermiso }  = require('../middlewares/validarPermiso');

const router = Router();

// ─── Utilidades ───────────────────────────────────────────────────────────────

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

function buildRango(start_date, end_date) {
  const now = new Date();
  start_date = toDate(start_date);
  end_date   = toDate(end_date);

  if (!start_date && !end_date) return { start: daysAgo(7), end: now };
  if (start_date && !end_date)  return { start: start_date, end: now };
  if (!start_date && end_date) {
    const base = new Date(end_date.getTime());
    base.setDate(base.getDate() - 7);
    return { start: base, end: end_date };
  }
  return { start: start_date, end: end_date };
}

async function enriquecerConNombre(rows) {
  return Promise.all(
    rows.map(async (r) => {
      let nombre_usuario = null;
      if (r.username) {
        const user = await Usuario.findOne({ where: { email: r.username } });
        if (user) {
          nombre_usuario = [user.nombre, user.apellido_paterno, user.apellido_materno]
            .filter(Boolean).join(' ');
        }
      }
      return { ...r.dataValues, nombre_usuario };
    })
  );
}

function paginacion(query) {
  const pageNum = Math.max(parseInt(query.page, 10) || 1, 1);
  const perPage = Math.min(parseInt(query.limit, 10) || 50, 500);
  return { pageNum, perPage, offset: (pageNum - 1) * perPage };
}

// ─── GET /api/auditoria/aplicacion ────────────────────────────────────────────

router.get('/aplicacion', validarJWT, validarPermiso('VER_AUDITORIA_APLICACION'), async (req, res) => {
  try {
    const {
      start_date, end_date,
      user_name, http_method, http_status_code,
      application_name, url, user_agent,
      min_duration, max_duration,
      ip_address, correlation_id,
      has_exception,
      entidad, accion,         // ← nuevos filtros
    } = req.query;

    const { start, end } = buildRango(start_date, end_date);
    const { pageNum, perPage, offset } = paginacion(req.query);

    const where = {
      fecha_inicio: { [Op.gte]: start, [Op.lte]: end },
    };

    if (user_name?.trim())        where.username         = { [Op.iLike]: `%${user_name.trim()}%` };
    if (http_method?.trim())      where.http_method      = http_method.trim().toUpperCase();
    if (application_name?.trim()) where.application_name = { [Op.iLike]: `%${application_name.trim()}%` };
    if (url?.trim())              where.url              = { [Op.iLike]: `%${url.trim()}%` };
    if (user_agent?.trim())       where.user_agent       = { [Op.iLike]: `%${user_agent.trim()}%` };
    if (ip_address?.trim())       where.ip_address       = ip_address.trim();
    if (correlation_id?.trim())   where.correlation_id   = correlation_id.trim();
    if (entidad?.trim())          where.entidad          = { [Op.iLike]: `%${entidad.trim()}%` };
    if (accion?.trim())           where.accion           = accion.trim().toUpperCase();

    if (http_status_code) {
      const code = Number(http_status_code);
      if (!isNaN(code)) where.http_status = code;
    }

    if (min_duration || max_duration) {
      where.duracion_ms = {};
      const min = Number(min_duration), max = Number(max_duration);
      if (!isNaN(min)) where.duracion_ms[Op.gte] = min;
      if (!isNaN(max)) where.duracion_ms[Op.lte] = max;
    }

    if (typeof has_exception !== 'undefined') {
      const v = String(has_exception).toLowerCase();
      if (v === 'true' || v === 'false') where.has_exception = v === 'true';
    }

    const { rows, count } = await AuditoriaAplicacion.findAndCountAll({
      where,
      order: [['fecha_inicio', 'DESC']],
      limit: perPage,
      offset,
    });

    const data = await enriquecerConNombre(rows);

    res.json({
      ok: true,
      total: count,
      page: pageNum,
      limit: perPage,
      data,
      applied_filters: {
        start_date: start.toISOString(),
        end_date:   end.toISOString(),
        user_name:        user_name        || null,
        http_method:      where.http_method      || null,
        http_status_code: where.http_status      || null,
        application_name: application_name || null,
        url:              url              || null,
        user_agent:       user_agent       || null,
        min_duration:     min_duration     || null,
        max_duration:     max_duration     || null,
        ip_address:       ip_address       || null,
        correlation_id:   correlation_id   || null,
        has_exception:    typeof where.has_exception === 'boolean' ? where.has_exception : null,
        entidad:          entidad          || null,
        accion:           accion           || null,
      },
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ ok: false, msg: 'Error listando auditoría de aplicación' });
  }
});

// ─── GET /api/auditoria/aplicacion/:id ────────────────────────────────────────
// Detalle de un registro, incluye dato_anterior, dato_nuevo y campos_modificados

router.get('/aplicacion/:id', validarJWT, validarPermiso('VER_AUDITORIA_APLICACION'), async (req, res) => {
  try {
    const registro = await AuditoriaAplicacion.findByPk(req.params.id);
    if (!registro) return res.status(404).json({ ok: false, msg: 'Registro no encontrado' });

    let nombre_usuario = null;
    if (registro.username) {
      const user = await Usuario.findOne({ where: { email: registro.username } });
      if (user) {
        nombre_usuario = [user.nombre, user.apellido_paterno, user.apellido_materno]
          .filter(Boolean).join(' ');
      }
    }

    res.json({ ok: true, data: { ...registro.dataValues, nombre_usuario } });
  } catch (e) {
    console.error(e);
    res.status(500).json({ ok: false, msg: 'Error obteniendo detalle de auditoría' });
  }
});

// ─── GET /api/auditoria/seguridad ─────────────────────────────────────────────

router.get('/seguridad', validarJWT, validarPermiso('VER_AUDITORIA_SEGURIDAD'), async (req, res) => {
  try {
    const {
      start_date, end_date,
      user_name, evento, exitoso,
      ip_address, correlation_id,
    } = req.query;

    const { start, end } = buildRango(start_date, end_date);
    const { pageNum, perPage, offset } = paginacion(req.query);

    const where = {
      fecha: { [Op.gte]: start, [Op.lte]: end },
    };

    if (user_name?.trim())      where.username       = { [Op.iLike]: `%${user_name.trim()}%` };
    if (ip_address?.trim())     where.ip_address     = ip_address.trim();
    if (correlation_id?.trim()) where.correlation_id = correlation_id.trim();

    // Filtro por evento: LOGIN_OK, LOGIN_FAIL, LOGOUT, etc.
    if (evento?.trim()) where.evento = evento.trim().toUpperCase();

    // Filtro por éxito: true / false
    if (typeof exitoso !== 'undefined') {
      const v = String(exitoso).toLowerCase();
      if (v === 'true' || v === 'false') where.exitoso = v === 'true';
    }

    const { rows, count } = await AuditoriaSeguridad.findAndCountAll({
      where,
      order: [['fecha', 'DESC']],
      limit: perPage,
      offset,
    });

    const data = await enriquecerConNombre(rows);

    res.json({
      ok: true,
      total: count,
      page: pageNum,
      limit: perPage,
      data,
      applied_filters: {
        start_date:     start.toISOString(),
        end_date:       end.toISOString(),
        user_name:      user_name      || null,
        evento:         evento         || null,
        exitoso:        typeof where.exitoso === 'boolean' ? where.exitoso : null,
        ip_address:     ip_address     || null,
        correlation_id: correlation_id || null,
      },
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ ok: false, msg: 'Error listando auditoría de seguridad' });
  }
});

module.exports = router;