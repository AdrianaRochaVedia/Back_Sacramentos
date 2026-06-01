const AuditoriaSeguridad = require('../models/AuditoriaSeguridad');

/**
 * Registra un evento de seguridad. Llamar directamente desde el controlador de auth.
 *
 * @param {object} opciones
 * @param {'LOGIN_OK'|'LOGIN_FAIL'|'LOGOUT'|'PASSWORD_CHANGE'|'TOKEN_REFRESH'|'ACCESS_DENIED'|'ROLE_CHANGE'} opciones.evento
 * @param {boolean} opciones.exitoso
 * @param {string}  [opciones.username]
 * @param {string}  [opciones.detalle]    - Razón del fallo, mensaje de error, etc.
 * @param {object}  [opciones.req]        - Express request para extraer ip, user-agent, etc.
 */
async function auditarSeguridad({ evento, exitoso, username = null, detalle = null, req = null }) {
  try {
    let ip        = null;
    let userAgent = null;
    let correlationId = null;

    if (req) {
      const xff = req.headers?.['x-forwarded-for'];
      ip = xff
        ? xff.split(',')[0].trim()
        : (req.headers?.['x-real-ip'] || req.ip || req.socket?.remoteAddress || null);
      userAgent     = req.headers?.['user-agent'] || null;
      correlationId = req.correlationId || null;
    }

    await AuditoriaSeguridad.create({
      fecha:            new Date(),
      username,
      evento,
      exitoso,
      ip_address:       ip,
      user_agent:       userAgent,
      detalle,
      correlation_id:   correlationId,
      application_name: process.env.APP_NAME || 'Sacramentos',
    });
  } catch (e) {
    console.warn('No se pudo registrar auditoría de seguridad:', e?.message || e);
  }
}

module.exports = { auditarSeguridad };