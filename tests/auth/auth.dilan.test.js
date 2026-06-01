/**
 * Pruebas unitarias — Módulo de Autenticación
 *
 * Lenguaje:  JavaScript (Node.js)
 * Framework: Jest 29
 *
 * Archivos bajo prueba:
 *   - controllers/usuarios.js
 *       loginUsuario              → login con o sin 2FA, bloqueo, usuario inexistente
 *       verificarCodigo2FA         → validar código 2FA y emitir token de sesión
 *       revalidarToken             → renovar JWT válido
 *   - controllers/passwordController.js
 *       solicitar                  → solicitar recuperación de contraseña
 *       validar                    → validar token de reset
 *       cambiar                    → cambiar contraseña con historial y fuerza
 *
 * Cada prueba sigue la estructura AAA:
 *   1) PREPARACIÓN  — datos de entrada y mocks
 *   2) LÓGICA       — invocación de la función bajo prueba
 *   3) VERIFICACIÓN — asserts sobre la respuesta
 */

jest.mock('../../models/Usuario', () => ({
  findOne: jest.fn(),
  findByPk: jest.fn(),
  findAndCountAll: jest.fn(),
}));
jest.mock('../../models/ConfiguracionSeguridad', () => ({
  findOne: jest.fn(),
}));
jest.mock('../../models/Rol', () => ({ findByPk: jest.fn() }));
jest.mock('../../models/Parroquia', () => ({}));
jest.mock('../../models/PasswordReset', () => ({
  create: jest.fn(),
  findOne: jest.fn(),
}));
jest.mock('../../models/HistoricoPassword', () => ({ findAll: jest.fn() }));

jest.mock('../../helpers/jwt', () => ({ generarJWT: jest.fn() }));
jest.mock('../../helpers/seguridad/manejarIntentos', () => ({
  verificarBloqueo: jest.fn(),
  registrarIntentoFallido: jest.fn(),
  resetearIntentos: jest.fn(),
}));
jest.mock('../../helpers/seguridad/verificarExpiracion', () => jest.fn());
jest.mock('../../helpers/twoFactorCode', () => ({ generarCodigo2FA: jest.fn() }));
jest.mock('../../helpers/twoFactorToken', () => ({
  generarToken2FA: jest.fn(),
  verificarToken2FA: jest.fn(),
}));
jest.mock('../../helpers/mailer', () => ({ sendMail: jest.fn() }));
jest.mock('../../middlewares/auditarSeguridad', () => ({ auditarSeguridad: jest.fn() }));
jest.mock('../../helpers/validar-password', () => ({ passwordFuerte: jest.fn() }));
jest.mock('../../helpers/passwordReset', () => ({
  generateTokenPair: jest.fn(() => ({ token: 'reset-token', token_hash: 'reset-hash' })),
  addMinutes: jest.fn((date) => date),
  maskEmail: jest.fn((email) => `****@${email.split('@')[1]}`),
}));

const bcrypt = require('bcryptjs');
const Usuario = require('../../models/Usuario');
const ConfiguracionSeguridad = require('../../models/ConfiguracionSeguridad');
const PasswordReset = require('../../models/PasswordReset');
const HistoricoPassword = require('../../models/HistoricoPassword');
const { generarJWT } = require('../../helpers/jwt');
const { verificarBloqueo, registrarIntentoFallido, resetearIntentos } = require('../../helpers/seguridad/manejarIntentos');
const verificarExpiracion = require('../../helpers/seguridad/verificarExpiracion');
const { generarCodigo2FA } = require('../../helpers/twoFactorCode');
const { generarToken2FA, verificarToken2FA } = require('../../helpers/twoFactorToken');
const { sendMail } = require('../../helpers/mailer');
const { auditarSeguridad } = require('../../middlewares/auditarSeguridad');
const { passwordFuerte } = require('../../helpers/validar-password');
const { solicitar, validar, cambiar } = require('../../controllers/passwordController');
const { DOMINIO_PERMITIDO } = require('../config');
const EMAIL_DILAN = `dilan.mamani@${DOMINIO_PERMITIDO}`;
const NO_EXISTE_EMAIL = `noexiste@${DOMINIO_PERMITIDO}`;
const PASSWORD_DILAN = 'AVFLash2403.0';

const { loginUsuario, verificarCodigo2FA, revalidarToken } = require('../../controllers/usuarios');

const mockRes = () => {
  const res = { locals: {} };
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

const mockReq = (props = {}) => ({
  body: {},
  query: {},
  params: {},
  ip: '127.0.0.1',
  ...props,
});

// ─────────────────────────────────────────────────────────────────────────────
// Módulo Auth
// ─────────────────────────────────────────────────────────────────────────────

describe('Módulo de Auth — Pruebas unitarias (Dilan)', () => {
  afterEach(() => jest.clearAllMocks());

  // ══════════════════════════════════════════════════════════════════════════
  // PRUEBA 1 — login correcto sin 2FA devuelve token y datos del usuario
  // ══════════════════════════════════════════════════════════════════════════
  test('PRUEBA 1 — login correcto sin 2FA devuelve token y datos del usuario', async () => {
    // 1) PREPARACIÓN
    ConfiguracionSeguridad.findOne.mockResolvedValue({ activo: true, usa_2fa: false });
    Usuario.findOne.mockResolvedValue({
      id_usuario: 7,
      email: EMAIL_DILAN,
      nombre: 'Dilan',
      password: 'hash',
      rol: { id_rol: 2, nombre: 'ADMIN' },
      parroquias: [{ id_parroquia: 10, nombre: 'Parroquia A' }],
    });
    verificarBloqueo.mockResolvedValue({ bloqueado: false });
    verificarExpiracion.mockReturnValue({ expirada: false });
    bcrypt.compareSync = jest.fn().mockReturnValue(true);
    resetearIntentos.mockResolvedValue(true);
    generarJWT.mockResolvedValue('jwt-token');

    const req = mockReq({ body: { email: EMAIL_DILAN, password: PASSWORD_DILAN } });
    const res = mockRes();

    // 2) LÓGICA
    await loginUsuario(req, res);

    // 3) VERIFICACIÓN
    expect(Usuario.findOne).toHaveBeenCalledWith(expect.objectContaining({ where: { email: EMAIL_DILAN, activo: true } }));
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ ok: true, requiere2FA: false, token: 'jwt-token' }));
  });

  // ══════════════════════════════════════════════════════════════════════════
  // PRUEBA 2 — login incorrecto responde 400 y registra intento fallido
  // ══════════════════════════════════════════════════════════════════════════
  test('PRUEBA 2 — login incorrecto responde 400 y registra intento fallido', async () => {
    // 1) PREPARACIÓN
    ConfiguracionSeguridad.findOne.mockResolvedValue({ activo: true, usa_2fa: false });
    Usuario.findOne.mockResolvedValue({
      id_usuario: 8,
      email: EMAIL_DILAN,
      nombre: 'Dilan',
      password: 'hash',
      rol: { id_rol: 2, nombre: 'ADMIN' },
      parroquias: [],
    });
    verificarBloqueo.mockResolvedValue({ bloqueado: false });
    bcrypt.compareSync = jest.fn().mockReturnValue(false);
    registrarIntentoFallido.mockResolvedValue({ msg: 'Contraseña incorrecta', bloqueado: false });

    const req = mockReq({ body: { email: EMAIL_DILAN, password: 'malo' } });
    const res = mockRes();

    // 2) LÓGICA
    await loginUsuario(req, res);

    // 3) VERIFICACIÓN
    expect(registrarIntentoFallido).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ ok: false, msg: 'Contraseña incorrecta', bloqueado: false });
  });

  // ══════════════════════════════════════════════════════════════════════════
  // PRUEBA 3 — bloqueo tras múltiples intentos devuelve bloqueado true
  // ══════════════════════════════════════════════════════════════════════════
  test('PRUEBA 3 — bloqueo tras múltiples intentos devuelve bloqueado true', async () => {
    // 1) PREPARACIÓN
    ConfiguracionSeguridad.findOne.mockResolvedValue({ activo: true, usa_2fa: false });
    Usuario.findOne.mockResolvedValue({
      id_usuario: 9,
      email: EMAIL_DILAN,
      nombre: 'Dilan',
      password: 'hash',
      rol: { id_rol: 2, nombre: 'ADMIN' },
      parroquias: [],
    });
    verificarBloqueo.mockResolvedValue({ bloqueado: false });
    bcrypt.compareSync = jest.fn().mockReturnValue(false);
    registrarIntentoFallido.mockResolvedValue({ msg: 'Usuario bloqueado', bloqueado: true });

    const req = mockReq({ body: { email: EMAIL_DILAN, password: 'malo' } });
    const res = mockRes();

    // 2) LÓGICA
    await loginUsuario(req, res);

    // 3) VERIFICACIÓN
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ ok: false, msg: 'Usuario bloqueado', bloqueado: true });
  });

  // ══════════════════════════════════════════════════════════════════════════
  // PRUEBA 4 — login con usuario inexistente devuelve 400
  // ══════════════════════════════════════════════════════════════════════════
  test('PRUEBA 4 — login con usuario inexistente devuelve 400', async () => {
    // 1) PREPARACIÓN
    ConfiguracionSeguridad.findOne.mockResolvedValue({ activo: true, usa_2fa: false });
    Usuario.findOne.mockResolvedValue(null);

    const req = mockReq({ body: { email: NO_EXISTE_EMAIL, password: 'abc123' } });
    const res = mockRes();

    // 2) LÓGICA
    await loginUsuario(req, res);

    // 3) VERIFICACIÓN
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ ok: false, msg: 'Usuario no existe' });
  });

  // ══════════════════════════════════════════════════════════════════════════
  // PRUEBA 5 — login con 2FA habilitado devuelve token2FA y requiere2FA true
  // ══════════════════════════════════════════════════════════════════════════
  test('PRUEBA 5 — login con 2FA habilitado devuelve token2FA y requiere2FA true', async () => {
    // 1) PREPARACIÓN
    ConfiguracionSeguridad.findOne.mockResolvedValue({ activo: true, usa_2fa: true });
    Usuario.findOne.mockResolvedValue({
      id_usuario: 11,
      email: EMAIL_DILAN,
      nombre: 'Dilan',
      password: 'hash',
      rol: { id_rol: 2, nombre: 'ADMIN' },
      parroquias: [],
    });
    verificarBloqueo.mockResolvedValue({ bloqueado: false });
    verificarExpiracion.mockReturnValue({ expirada: false });
    bcrypt.compareSync = jest.fn().mockReturnValue(true);
    generarCodigo2FA.mockReturnValue('123456');
    generarToken2FA.mockResolvedValue('token-2fa');
    sendMail.mockResolvedValue(true);

    const req = mockReq({ body: { email: EMAIL_DILAN, password: PASSWORD_DILAN } });
    const res = mockRes();

    // 2) LÓGICA
    await loginUsuario(req, res);

    // 3) VERIFICACIÓN
    expect(sendMail).toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ ok: true, requiere2FA: true, token2FA: 'token-2fa' }));
  });

  // ══════════════════════════════════════════════════════════════════════════
  // PRUEBA 6 — verificar 2FA correcto devuelve token de sesión
  // ══════════════════════════════════════════════════════════════════════════
  test('PRUEBA 6 — verificar 2FA correcto devuelve token de sesión', async () => {
    // 1) PREPARACIÓN
    verificarToken2FA.mockReturnValue({ tipo: '2fa', uid: 15, email: EMAIL_DILAN, codigo: '123456' });
    Usuario.findOne.mockResolvedValue({
      id_usuario: 15,
      email: EMAIL_DILAN,
      nombre: 'Dilan',
      rol: { id_rol: 2, nombre: 'ADMIN' },
      parroquias: [{ id_parroquia: 10, nombre: 'Parroquia X' }],
      password: 'hash',
    });
    resetearIntentos.mockResolvedValue(true);
    generarJWT.mockResolvedValue('session-token');

    const req = mockReq({ body: { token2FA: 'token-2fa', codigo: '123456' } });
    const res = mockRes();

    // 2) LÓGICA
    await verificarCodigo2FA(req, res);

    // 3) VERIFICACIÓN
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ ok: true, requiere2FA: false, token: 'session-token' }));
  });

  // ══════════════════════════════════════════════════════════════════════════
  // PRUEBA 7 — código 2FA incorrecto devuelve 400
  // ══════════════════════════════════════════════════════════════════════════
  test('PRUEBA 7 — código 2FA incorrecto devuelve 400', async () => {
    // 1) PREPARACIÓN
    verificarToken2FA.mockReturnValue({ tipo: '2fa', uid: 15, email: EMAIL_DILAN, codigo: '123456' });

    const req = mockReq({ body: { token2FA: 'token-2fa', codigo: '000000' } });
    const res = mockRes();

    // 2) LÓGICA
    await verificarCodigo2FA(req, res);

    // 3) VERIFICACIÓN
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ ok: false, msg: 'Código incorrecto' });
  });

  // ══════════════════════════════════════════════════════════════════════════
  // PRUEBA 8 — código 2FA expirado devuelve 401
  // ══════════════════════════════════════════════════════════════════════════
  test('PRUEBA 8 — código 2FA expirado devuelve 401', async () => {
    // 1) PREPARACIÓN
    verificarToken2FA.mockReturnValue(null);

    const req = mockReq({ body: { token2FA: 'token-2fa', codigo: '123456' } });
    const res = mockRes();

    // 2) LÓGICA
    await verificarCodigo2FA(req, res);

    // 3) VERIFICACIÓN
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ ok: false, msg: 'El código expiró. Vuelve a iniciar sesión' });
  });

  // ══════════════════════════════════════════════════════════════════════════
  // PRUEBA 9 — revalidación de token devuelve un nuevo JWT
  // ══════════════════════════════════════════════════════════════════════════
  test('PRUEBA 9 — revalidación de token devuelve un nuevo JWT', async () => {
    // 1) PREPARACIÓN
    generarJWT.mockResolvedValue('renewed-token');

    const req = { uid: 20, email: EMAIL_DILAN };
    const res = mockRes();

    // 2) LÓGICA
    await revalidarToken(req, res);

    // 3) VERIFICACIÓN
    expect(res.json).toHaveBeenCalledWith({ ok: true, uid: 20, email: EMAIL_DILAN, token: 'renewed-token' });
  });

  // ══════════════════════════════════════════════════════════════════════════
  // PRUEBA 10 — solicitar recuperación de contraseña responde ok y envía correo
  // ══════════════════════════════════════════════════════════════════════════
  test('PRUEBA 10 — solicitar recuperación de contraseña responde ok y envía correo', async () => {
    // 1) PREPARACIÓN
    Usuario.findOne.mockResolvedValue({ id_usuario: 25, email: EMAIL_DILAN, activo: true });
    sendMail.mockResolvedValue(true);
    PasswordReset.create.mockResolvedValue(true);

    const req = mockReq({ body: { email: EMAIL_DILAN } });
    const res = mockRes();

    // 2) LÓGICA
    await solicitar(req, res);

    // 3) VERIFICACIÓN
    expect(PasswordReset.create).toHaveBeenCalled();
    expect(sendMail).toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ ok: true, msg: 'Si el correo existe, se enviará un enlace de recuperación.' }));
  });

});
