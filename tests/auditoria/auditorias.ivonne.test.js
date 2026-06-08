const request = require('supertest');
const { app } = require('../../index');
const { sequelize } = require('../../database/config');
const { TOKEN_VALIDO, TOKEN_SIN_PERMISOS } = require('../config');

// Variable para guardar el ID de un log recién creado y usarlo en la prueba 8
let idLogRecienteAplicacion; 

beforeAll(async () => {
  await sequelize.authenticate();
}, 30000);

afterAll(async () => {
  await sequelize.close();
}, 30000);

/* ==========================================================
   AUDITORIA DE SEGURIDAD
   (Probar que se guardan los eventos de acceso)
========================================================== */

describe('Auditoría de Seguridad - Generación y Filtros', () => {

  // PRUEBA 1 — Verificar que se registra un intento de Login
  test('Debe registrar un log de seguridad al intentar iniciar sesión', async () => {
    // 1. Preparación de la prueba
    const credencialesPrueba = { 
      email: 'test_auditoria@miga.com', 
      password: 'ClaveIncorrecta123!' 
    };

    // 2. Lógica de la prueba
    // Primero disparamos la acción de login fallido
    await request(app)
      .post('/api/usuarios/login')
      .send(credencialesPrueba);

    // Luego consultamos la auditoría buscando el registro más reciente
    const response = await request(app)
      .get('/api/auditoria/seguridad?limit=1')
      .set('x-token', TOKEN_VALIDO);

    // 3. Verificación (Assert)
    expect(response.status).toBe(200);
    expect(response.body.data.length).toBeGreaterThan(0);
    expect(response.body.data[0]).toHaveProperty('evento');
  });

  // PRUEBA 2 — Filtrar auditoría por LOGIN_FAIL
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

  // PRUEBA 3 — Filtrar auditoría por eventos exitosos
  test('Debe retornar únicamente registros exitosos', async () => {
    // 1. Preparación de la prueba
    const filtroExitoso = true;

    // 2. Lógica de la prueba
    const response = await request(app)
      .get(`/api/auditoria/seguridad?exitoso=${filtroExitoso}`)
      .set('x-token', TOKEN_VALIDO);

    // 3. Verificación (Assert)
    expect(response.status).toBe(200);
    expect(response.body.ok).toBe(true);
    response.body.data.forEach(item => {
      expect(item.exitoso).toBe(true);
    });
  });

});


/* ==========================================================
   AUDITORIA DE APLICACION
   (Probar que se guardan los movimientos en la API)
========================================================== */

describe('Auditoría de Aplicación - Generación y Filtros', () => {

  // PRUEBA 4 — Verificar registro de una consulta (GET)
  test('Debe registrar un log de aplicación al hacer GET en configuracion-seguridad', async () => {
    // 1. Preparación de la prueba
    const urlConsultada = '/api/configuracion-seguridad';

    // 2. Lógica de la prueba
    await request(app).get(urlConsultada).set('x-token', TOKEN_VALIDO);

    const response = await request(app)
      .get('/api/auditoria/aplicacion?limit=1')
      .set('x-token', TOKEN_VALIDO);

    // 3. Verificación (Assert)
    expect(response.status).toBe(200);
    const ultimoLog = response.body.data[0];
    expect(ultimoLog.url).toContain(urlConsultada);
    expect(ultimoLog.http_method).toBe('GET');
  });

  // PRUEBA 5 — Verificar registro de una modificación (PUT)
  test('Debe registrar un log de aplicación al modificar configuracion-seguridad (PUT)', async () => {
    // 1. Preparación de la prueba
    const dataModificada = { longitud_minima: 12 };

    // 2. Lógica de la prueba
    await request(app)
      .put('/api/configuracion-seguridad')
      .set('x-token', TOKEN_VALIDO)
      .send(dataModificada);

    const response = await request(app)
      .get('/api/auditoria/aplicacion?limit=1')
      .set('x-token', TOKEN_VALIDO);

    // 3. Verificación (Assert)
    expect(response.status).toBe(200);
    const ultimoLog = response.body.data[0];
    
    // Guardamos el ID dinámicamente para usarlo en la Prueba 8
    idLogRecienteAplicacion = ultimoLog.id_log;

    expect(ultimoLog.url).toContain('/api/configuracion-seguridad');
    expect(ultimoLog.http_method).toBe('PUT');
  });

  // PRUEBA 6 — Filtrar auditoría por método
  test('Debe retornar únicamente registros con método PUT', async () => {
    // 1. Preparación de la prueba
    const metodo = 'PUT';
    
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

  // PRUEBA 7 — Filtrar auditoría por excepciones
  test('Debe retornar únicamente registros con excepción', async () => {
    // 1. Preparación de la prueba
    const conExcepcion = true;

    // 2. Lógica de la prueba
    const response = await request(app)
      .get(`/api/auditoria/aplicacion?has_exception=${conExcepcion}`)
      .set('x-token', TOKEN_VALIDO);

    // 3. Verificación (Assert)
    expect(response.status).toBe(200);
    expect(response.body.ok).toBe(true);
    response.body.data.forEach(item => {
      expect(item.has_exception).toBe(true);
    });
  });

  // PRUEBA 8 — Obtener detalle de auditoría existente
  test('Debe retornar el detalle completo del registro generado en pruebas anteriores', async () => {
    // 1. Preparación de la prueba
    const idLog = idLogRecienteAplicacion;

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


/* ==========================================================
   VALIDACIÓN DE PERMISOS
   (Probar que el sistema bloquea a usuarios no autorizados)
========================================================== */

describe('Validación de Permisos - Accesos denegados', () => {

  // PRUEBA 9 — Acceso sin permisos a auditoría de seguridad
  test('Debe retornar 403 al consultar auditoría de seguridad sin permisos', async () => {
    // 1. Preparación de la prueba
    // Se utilizará directamente el token sin permisos importado

    // 2. Lógica de la prueba
    const response = await request(app)
      .get('/api/auditoria/seguridad')
      .set('x-token', TOKEN_SIN_PERMISOS);

    // 3. Verificación (Assert)
    expect(response.status).toBe(403);
    expect(response.body.ok).toBe(false);
  });

  // PRUEBA 10 — Acceso sin permisos a auditoría de aplicación
  test('Debe retornar 403 al consultar auditoría de aplicación sin permisos', async () => {
    // 1. Preparación de la prueba
    // Se utilizará directamente el token sin permisos importado

    // 2. Lógica de la prueba
    const response = await request(app)
      .get('/api/auditoria/aplicacion')
      .set('x-token', TOKEN_SIN_PERMISOS);

    // 3. Verificación (Assert)
    expect(response.status).toBe(403);
    expect(response.body.ok).toBe(false);
  });

});