const AuditoriaAplicacion = require('../models/AuditoriaAplicacion');
const { calcularDiff } = require('../utils/auditDiff');

const SENSITIVE = /^(password|contrasena|pass|secret|token|authorization|api[_-]?key|jwt|bearer)$/i;

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
  // Extrae el recurso principal de la URL: /api/usuarios/123 → 'usuarios'
  const match = url.replace(/\?.*$/, '').match(/\/api\/([^/]+)/);
  return match ? match[1] : null;
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

    res.locals._hasException = false;

    res.on('finish', async () => {
      try {
        const fin      = new Date();
        const duracion = fin - inicio;

        const username = req.usuario?.nombre || req.usuario?.email || req.email || req.uid || null;

        // Cuerpo de la request sanitizado
        let reqBody = null;
        const isJson      = (req.headers['content-type'] || '').toLowerCase().includes('application/json');
        const shouldCapture = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method);
        if (shouldCapture && isJson && req.body) {
          reqBody = sanitizeBody(req.body);
        }

        // ── Dato anterior / nuevo ──────────────────────────────────────────
        // Los controladores deben poblar estas propiedades en res.locals:
        //   res.locals._datoAnterior = { ...registroOriginal }
        //   res.locals._datoNuevo    = { ...registroActualizado }
        const instancia    = res.locals._instancia || null;
        const datoAnterior = instancia?._datoAnterior ? sanitizeBody(instancia._datoAnterior) : null;
        const datoNuevo    = instancia?._datoNuevo    ? sanitizeBody(instancia._datoNuevo)    : null;
        const camposModificados = calcularDiff(datoAnterior, datoNuevo);

        await AuditoriaAplicacion.create({
          fecha_inicio:     inicio,
          fecha_fin:        fin,
          duracion_ms:      duracion,
          username,
          http_method:      method,
          http_status:      res.statusCode,
          url,
          entidad:          resolverEntidad(url),
          accion:           resolverAccion(method),
          dato_anterior:    datoAnterior,
          dato_nuevo:       datoNuevo,
          campos_modificados: camposModificados,
          application_name: process.env.APP_NAME || 'Sacramentos',
          ip_address:       ip,
          correlation_id:   req.correlationId || null,
          has_exception:    !!res.locals._hasException,
          user_agent:       req.headers['user-agent'] || null,
          mensaje:          `${method} ${url}`,
          request_body:     reqBody,
        });
      } catch (e) {
        console.warn('No se pudo registrar auditoría de aplicación:', e?.message || e);
      }
    });

    next();
  };
};