const request = require('supertest');
const { app } = require('../../index');
const { sequelize } = require('../../database/config');
const { TOKEN_VALIDO } = require('../config');

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
    // 1. Lógica: Disparamos una acción de seguridad (ej. login fallido)
    // Nota: Ajusta la ruta '/api/usuarios/login' si la tuya se llama distinto
    await request(app)
      .post('/api/usuarios/login')
      .send({ email: 'test_auditoria@miga.com', password: 'ClaveIncorrecta123!' });

    // 2. Consultar la auditoría buscando el registro más reciente
    const response = await request(app)
      .get('/api/auditoria/seguridad?limit=1')
      .set('x-token', TOKEN_VALIDO);

    // 3. Verificación (Assert): Revisamos que el log esté ahí
    expect(response.status).toBe(200);
    expect(response.body.data.length).toBeGreaterThan(0); // Que haya guardado algo
    expect(response.body.data[0]).toHaveProperty('evento'); // Que tenga un evento (ej. LOGIN_FAIL)
  });

  // PRUEBA 2 — Filtrar auditoría por LOGIN_FAIL
  test('Debe retornar únicamente eventos LOGIN_FAIL', async () => {
    const evento = 'LOGIN_FAIL';
    
    const response = await request(app)
      .get(`/api/auditoria/seguridad?evento=${evento}`)
      .set('x-token', TOKEN_VALIDO);

    expect(response.status).toBe(200);
    expect(response.body.ok).toBe(true);
    response.body.data.forEach(item => {
      expect(item.evento).toBe(evento);
    });
  });

  // PRUEBA 3 — Filtrar auditoría por eventos exitosos
  test('Debe retornar únicamente registros exitosos', async () => {
    const response = await request(app)
      .get('/api/auditoria/seguridad?exitoso=true')
      .set('x-token', TOKEN_VALIDO);

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
    // 1. Lógica: Ejecutar una petición GET real a tu API
    await request(app)
      .get('/api/configuracion-seguridad')
      .set('x-token', TOKEN_VALIDO);

    // 2. Consultar la auditoría
    const response = await request(app)
      .get('/api/auditoria/aplicacion?limit=1')
      .set('x-token', TOKEN_VALIDO);

    // 3. Verificación: El último registro debe ser nuestro GET
    expect(response.status).toBe(200);
    const ultimoLog = response.body.data[0];
    expect(ultimoLog.url).toContain('/api/configuracion-seguridad');
    expect(ultimoLog.http_method).toBe('GET');
  });

  // PRUEBA 5 — Verificar registro de una modificación (PUT)
  test('Debe registrar un log de aplicación al modificar configuracion-seguridad (PUT)', async () => {
    // 1. Lógica: Modificamos un dato en la API
    await request(app)
      .put('/api/configuracion-seguridad')
      .set('x-token', TOKEN_VALIDO)
      .send({ longitud_minima: 12 });

    // 2. Consultar la auditoría
    const response = await request(app)
      .get('/api/auditoria/aplicacion?limit=1')
      .set('x-token', TOKEN_VALIDO);

    // 3. Verificación: Asegurarse de que capturó el método PUT
    expect(response.status).toBe(200);
    const ultimoLog = response.body.data[0];
    
    // Guardamos el ID para usarlo en la Prueba 8
    idLogRecienteAplicacion = ultimoLog.id_log;

    expect(ultimoLog.url).toContain('/api/configuracion-seguridad');
    expect(ultimoLog.http_method).toBe('PUT');
  });

  // PRUEBA 6 — Filtrar auditoría por método
  test('Debe retornar únicamente registros con método PUT', async () => {
    const metodo = 'PUT';
    
    const response = await request(app)
      .get(`/api/auditoria/aplicacion?http_method=${metodo}`)
      .set('x-token', TOKEN_VALIDO);

    expect(response.status).toBe(200);
    expect(response.body.ok).toBe(true);
    response.body.data.forEach(item => {
      expect(item.http_method).toBe(metodo);
    });
  });

  // PRUEBA 7 — Filtrar auditoría por excepciones
  test('Debe retornar únicamente registros con excepción', async () => {
    const response = await request(app)
      .get('/api/auditoria/aplicacion?has_exception=true')
      .set('x-token', TOKEN_VALIDO);

    expect(response.status).toBe(200);
    expect(response.body.ok).toBe(true);
    response.body.data.forEach(item => {
      expect(item.has_exception).toBe(true);
    });
  });

  // PRUEBA 8 — Obtener detalle de auditoría existente
  test('Debe retornar el detalle completo del registro generado en pruebas anteriores', async () => {
    // 1. Usamos el ID que guardamos en la Prueba 5
    const idLog = idLogRecienteAplicacion;

    // 2. Lógica: Pedir el detalle
    const response = await request(app)
      .get(`/api/auditoria/aplicacion/${idLog}`)
      .set('x-token', TOKEN_VALIDO);

    // 3. Verificación
    expect(response.status).toBe(200);
    expect(response.body.ok).toBe(true);
    expect(response.body.data).toHaveProperty('id_log');
    expect(response.body.data.id_log).toBe(String(idLog)); // Recuerda el casteo a String!
  });

});