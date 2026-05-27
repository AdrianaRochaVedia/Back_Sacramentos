const AuditoriaAplicacion = require('../models/AuditoriaAplicacion');
const { calcularDiff } = require('../utils/auditDiff');

const SENSITIVE = /(password|passwd|contrasena|secret|token|authorization|api[_-]?key|jwt|bearer|codigo)/i;

function sanitizeBody(body) {
  if (!body || typeof body !== 'object') return null;
  const seen = new WeakSet();
  const walk = (val) => {
    if (val && typeof val === 'object') {
      if (seen.has(val)) return null;
      seen.add(val);
      if (Array.isArray(val)) return val.map(walk);
      const out = {};
      for (const [k, v] of Object.entries(val)) {
        out[k] = SENSITIVE.test(k) ? '***' : walk(v);
      }
      return out;
    }
    if (typeof val === 'string') {
      return val.length > 2048 ? val.slice(0, 2048) + '…[truncated]' : val;
    }
    return val;
  };
  return walk(body);
}

function resolverAccion(method) {
  const map = { GET: 'READ', POST: 'CREATE', PUT: 'UPDATE', PATCH: 'UPDATE', DELETE: 'DELETE' };
  return map[method] || method;
}

function resolverEntidad(url) {
  const match = url.replace(/\?.*$/, '').match(/\/api\/([^/?]+)/);
  return match ? match[1] : null;
}

function resolverUsername(req) {
  // Prioridad: siempre email para que enriquecerConNombre pueda hacer el join
  if (req.usuario?.email) return req.usuario.email;
  if (req.email)          return req.email;

  // Para requests no autenticados (ej: login fallido), intentar extraer del body
  if (req.body?.email && typeof req.body.email === 'string') return req.body.email;

  if (req.uid) return String(req.uid);
  return null;
}

function resolverReqBody(req, method) {
  const shouldCapture = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method);
  if (!shouldCapture || !req.body || typeof req.body !== 'object') return null;

  const sanitized = sanitizeBody(req.body);
  // Si quedó vacío después de sanitizar, no guardarlo
  return sanitized && Object.keys(sanitized).length ? sanitized : null;
}

const SKIP_PATHS = ['/api/auditoria'];

module.exports = function auditarAplicacion() {
  return function (req, res, next) {
    if (SKIP_PATHS.some(p => req.originalUrl?.startsWith(p))) return next();

    const inicio = new Date();
    const method = (req.method || 'GET').toUpperCase();
    const url    = req.originalUrl || req.url || '/';

    const xff = req.headers['x-forwarded-for'];
    const ip  = xff
      ? xff.split(',')[0].trim()
      : (req.headers['x-real-ip'] || req.ip || req.socket?.remoteAddress || null);

    // Capturar body antes del finish (algunos frameworks lo vacían después)
    const reqBodySnapshot = resolverReqBody(req, method);

    res.locals._hasException = false;

    res.on('finish', async () => {
      try {
        const fin      = new Date();
        const duracion = fin - inicio;

        const username = resolverUsername(req);

        const instancia         = res.locals._instancia || null;
        const datoAnterior      = instancia?._datoAnterior ? sanitizeBody(instancia._datoAnterior) : null;
        const datoNuevo         = instancia?._datoNuevo    ? sanitizeBody(instancia._datoNuevo)    : null;
        const camposModificados = calcularDiff(datoAnterior, datoNuevo);

        const mensajeError = res.locals._hasException
          ? (res.locals._errorMsg || null)
          : null;

        await AuditoriaAplicacion.create({
          fecha_inicio:       inicio,
          fecha_fin:          fin,
          duracion_ms:        duracion,
          username,
          http_method:        method,
          http_status:        res.statusCode,
          url,
          entidad:            resolverEntidad(url),
          accion:             resolverAccion(method),
          dato_anterior:      datoAnterior,
          dato_nuevo:         datoNuevo,
          campos_modificados: camposModificados,
          application_name:   process.env.APP_NAME || 'Sacramentos',
          ip_address:         ip,
          correlation_id:     req.correlationId || null,
          has_exception:      !!res.locals._hasException,
          user_agent:         req.headers['user-agent'] || null,
          mensaje:            mensajeError || `${method} ${url}`,
          request_body:       reqBodySnapshot,
        });
      } catch (e) {
        console.warn('No se pudo registrar auditoría de aplicación:', e?.message || e);
      }
    });

    next();
  };
};
