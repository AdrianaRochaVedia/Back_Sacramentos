const Auditoria = require('../models/Auditoria');

// Sanea y enmascara campos sensibles del body antes de guardar en auditoría
function sanitizeBody(body) {
  if (!body || typeof body !== 'object') return null;
  const SENSITIVE = /^(password|contrasena|pass|secret|token|authorization|api[_-]?key|jwt|bearer)$/i;
  const seen = new WeakSet();
  const walk = (val) => {
    if (val && typeof val === 'object') {
      if (seen.has(val)) return null; // evita ciclos
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

const SKIP_PATHS = ['/api/auditoria']; // agrega healthchecks si quieres

module.exports = function auditar() {
  return function (req, res, next) {
    // Evitar auditar rutas específicas
    if (SKIP_PATHS.some(p => req.originalUrl?.startsWith(p))) {
      return next();
    }

    const inicio = new Date();

    // Usuario (ajústalo a tu middleware de JWT)
    let username = null;
    try {
      username = req.usuario?.nombre || req.usuario?.email || null;
    } catch (_) {}

    const method = (req.method || 'GET').toUpperCase();
    const url = req.originalUrl || req.url || '/';
    const userAgent = req.headers['user-agent'] || null;
    const ip = (req.headers['x-forwarded-for'] || '').split(',')[0].trim()
           || req.ip
           || req.socket?.remoteAddress
           || null;

    const applicationName = process.env.APP_NAME || 'Sacramentos';
    const correlationId = req.correlationId || null;

    // Bandera que setea el error handler
    res.locals._hasException = false;

    res.on('finish', async () => {
      try {
        const fin = new Date();
        const duracion = fin.getTime() - inicio.getTime();

        let reqBody = null;
        try {
          const isJson = (req.headers['content-type'] || '').toLowerCase().includes('application/json');
          const shouldCapture = ['POST','PUT','PATCH','DELETE'].includes(method);
          if (shouldCapture && isJson && req.body && typeof req.body === 'object') {
            reqBody = sanitizeBody(req.body);
          }
        } catch (_) {}

        await Auditoria.create({
          fecha_inicio: inicio,
          fecha_fin: fin,
          duracion_ms: duracion,
          username,
          http_method: method,
          http_status: res.statusCode || 200,
          url,
          application_name: applicationName,
          ip_address: ip,
          correlation_id: correlationId,
          has_exception: !!res.locals._hasException,
          user_agent: userAgent,
          mensaje: `${method} ${url}`,
          request_body: reqBody,
        });
      } catch (e) {
        console.warn('No se pudo registrar auditoría:', e?.message || e);
      }
    });

    next();
  };
};
