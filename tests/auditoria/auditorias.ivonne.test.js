const request = require('supertest');
const { app } = require('../../index');
const { sequelize } = require('../../database/config');
const {
  TOKEN_VALIDO,
  TOKEN_SIN_PERMISOS
} = require('../config');

let ID_AUDITORIA_APLICACION_EXISTENTE = 1;

beforeAll(async () => {
  await sequelize.authenticate();
}, 30000);

afterAll(async () => {
  await sequelize.close();
}, 30000);

/* ==========================================================
   AUDITORIA DE SEGURIDAD
========================================================== */

// PRUEBA 1 — Obtener auditoría de seguridad sin filtros
describe('Obtener auditoría de seguridad sin filtros', () => {
  test('Debe retornar 200 y una lista de registros', async () => {

    // 1. Preparación de la prueba

    // 2. Lógica de la prueba
    const response = await request(app)
      .get('/api/auditoria/seguridad')
      .set('x-token', TOKEN_VALIDO);

    // 3. Verificación (Assert)
    expect(response.status).toBe(200);
    expect(response.body.ok).toBe(true);
    expect(Array.isArray(response.body.data)).toBe(true);
    expect(response.body).toHaveProperty('total');
    expect(response.body).toHaveProperty('page');
    expect(response.body).toHaveProperty('limit');
  });
});


// PRUEBA 2 — Filtrar auditoría por LOGIN_FAIL
describe('Filtrar auditoría de seguridad por LOGIN_FAIL', () => {
  test('Debe retornar únicamente eventos LOGIN_FAIL', async () => {

    // 1. Preparación de la prueba
    const evento = 'LOGIN_FAIL';

    // 2. Lógica de la prueba
    const response = await request(app)
      .get(`/api/auditoria/seguridad?evento=${evento}`)
      .set('x-token', TOKEN_VALIDO);

    // 3. Verificación (Assert)
    expect(response.status).toBe(200);
    expect(response.body.ok).toBe(true);

    response.body.data.forEach(item => {
      expect(item.evento).toBe(evento);
    });
  });
});


// PRUEBA 3 — Filtrar auditoría por eventos exitosos
describe('Filtrar auditoría de seguridad por eventos exitosos', () => {
  test('Debe retornar únicamente registros exitosos', async () => {

    // 1. Preparación de la prueba

    // 2. Lógica de la prueba
    const response = await request(app)
      .get('/api/auditoria/seguridad?exitoso=true')
      .set('x-token', TOKEN_VALIDO);

    // 3. Verificación (Assert)
    expect(response.status).toBe(200);
    expect(response.body.ok).toBe(true);

    response.body.data.forEach(item => {
      expect(item.exitoso).toBe(true);
    });
  });
});


// PRUEBA 4 — Acceso sin permisos a auditoría de seguridad
describe('Acceso sin permisos a auditoría de seguridad', () => {
  test('Debe retornar 403 cuando el usuario no tiene permisos', async () => {

    // 1. Preparación de la prueba

    // 2. Lógica de la prueba
    const response = await request(app)
      .get('/api/auditoria/seguridad')
      .set('x-token', TOKEN_SIN_PERMISOS);

    // 3. Verificación (Assert)
    expect(response.status).toBe(403);
    expect(response.body.ok).toBe(false);
  });
});


/* ==========================================================
   AUDITORIA DE APLICACION
========================================================== */

// PRUEBA 5 — Obtener auditoría de aplicación sin filtros
describe('Obtener auditoría de aplicación sin filtros', () => {
  test('Debe retornar 200 y una lista de registros', async () => {

    // 1. Preparación de la prueba

    // 2. Lógica de la prueba
    const response = await request(app)
      .get('/api/auditoria/aplicacion')
      .set('x-token', TOKEN_VALIDO);

    // 3. Verificación (Assert)
    expect(response.status).toBe(200);
    expect(response.body.ok).toBe(true);
    expect(Array.isArray(response.body.data)).toBe(true);
    expect(response.body).toHaveProperty('total');
    expect(response.body).toHaveProperty('page');
    expect(response.body).toHaveProperty('limit');
  });
});


// PRUEBA 6 — Filtrar auditoría por método POST
describe('Filtrar auditoría de aplicación por método POST', () => {
  test('Debe retornar únicamente registros POST', async () => {

    // 1. Preparación de la prueba
    const metodo = 'POST';

    // 2. Lógica de la prueba
    const response = await request(app)
      .get(`/api/auditoria/aplicacion?http_method=${metodo}`)
      .set('x-token', TOKEN_VALIDO);

    // 3. Verificación (Assert)
    expect(response.status).toBe(200);
    expect(response.body.ok).toBe(true);

    response.body.data.forEach(item => {
      expect(item.http_method).toBe(metodo);
    });
  });
});


// PRUEBA 7 — Filtrar auditoría por excepciones
describe('Filtrar auditoría de aplicación por excepciones', () => {
  test('Debe retornar únicamente registros con excepción', async () => {

    // 1. Preparación de la prueba

    // 2. Lógica de la prueba
    const response = await request(app)
      .get('/api/auditoria/aplicacion?has_exception=true')
      .set('x-token', TOKEN_VALIDO);

    // 3. Verificación (Assert)
    expect(response.status).toBe(200);
    expect(response.body.ok).toBe(true);

    response.body.data.forEach(item => {
      expect(item.has_exception).toBe(true);
    });
  });
});


// PRUEBA 8 — Obtener detalle de auditoría existente
describe('Obtener detalle de auditoría existente', () => {
  test('Debe retornar el detalle completo del registro', async () => {

    // 1. Preparación de la prueba
    const idLog = ID_AUDITORIA_APLICACION_EXISTENTE;

    // 2. Lógica de la prueba
    const response = await request(app)
      .get(`/api/auditoria/aplicacion/${idLog}`)
      .set('x-token', TOKEN_VALIDO);

    // 3. Verificación (Assert)
    expect(response.status).toBe(200);
    expect(response.body.ok).toBe(true);
    expect(response.body.data).toHaveProperty('id_log');
    expect(response.body.data.id_log).toBe(String(idLog));
  });
});


// PRUEBA 9 — Obtener detalle de auditoría inexistente
describe('Obtener detalle de auditoría inexistente', () => {
  test('Debe retornar 404 cuando el registro no existe', async () => {

    // 1. Preparación de la prueba
    const idInexistente = 99999999;

    // 2. Lógica de la prueba
    const response = await request(app)
      .get(`/api/auditoria/aplicacion/${idInexistente}`)
      .set('x-token', TOKEN_VALIDO);

    // 3. Verificación (Assert)
    expect(response.status).toBe(404);
    expect(response.body.ok).toBe(false);
    expect(response.body.msg).toMatch(/no encontrado/i);
  });
});


// PRUEBA 10 — Acceso sin permisos a auditoría de aplicación
describe('Acceso sin permisos a auditoría de aplicación', () => {
  test('Debe retornar 403 cuando el usuario no tiene permisos', async () => {

    // 1. Preparación de la prueba

    // 2. Lógica de la prueba
    const response = await request(app)
      .get('/api/auditoria/aplicacion')
      .set('x-token', TOKEN_SIN_PERMISOS);

    // 3. Verificación (Assert)
    expect(response.status).toBe(403);
    expect(response.body.ok).toBe(false);
  });
});