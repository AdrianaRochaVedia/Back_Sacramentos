const request = require('supertest');
const { app } = require('../../index');
const { sequelize } = require('../../database/config');
const Usuario = require('../../models/Usuario');

const TOKEN_VALIDO = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1aWQiOjUsImVtYWlsIjoidGFuaWEucGVyZXouZEB1Y2IuZWR1LmJvIiwiaWF0IjoxNzgwMjY2Mjk4LCJleHAiOjE3ODAyOTE0OTh9.byUBDnP6xZhPeO_V5OrAP24CaFsi-1DQHtdf8HgvVrM';
const DOMINIO_PERMITIDO = 'ucb.edu.bo';

beforeAll(async () => {
  await sequelize.authenticate();
  await Usuario.destroy({ 
    where: { email: `isabel.rocha.v@${DOMINIO_PERMITIDO}` } 
  });
  await Usuario.destroy({
    where: {
      nombre:           'Isabel Antonella',
      apellido_paterno: 'Rocha',
      apellido_materno: 'Vedia'
    }
  });
});

afterAll(async () => {
  await Usuario.destroy({ where: { email: `isabel.rocha.v@${DOMINIO_PERMITIDO}` } });
  await sequelize.close();
});


// CASO 1 — Crear usuario con datos válidos
describe('Crear usuario con datos válidos', () => {
  test('Debe retornar 201 y los datos del usuario creado', async () => {
    // 1. Preparación de la prueba
    const nuevoUsuario = {
      nombre:           'Isabel Antonella',
      apellido_paterno: 'Rocha',
      apellido_materno: 'Vedia',
      email:            `isabel.rocha.v@${DOMINIO_PERMITIDO}`,
      password:         'Clave1234!',
      fecha_nacimiento: '1995-06-20',
      id_rol:           2
    };

    // 2. Lógica de la Prueba
    const response = await request(app)
      .post('/api/usuarios/new')
      .set('x-token', TOKEN_VALIDO)
      .send(nuevoUsuario);

    // 3. Verificación (Assert)
    expect(response.status).toBe(201);
    expect(response.body.ok).toBe(true);
    expect(response.body.usuario).toHaveProperty('id_usuario');
    expect(response.body.usuario.email).toBe(nuevoUsuario.email);
    expect(response.body).toHaveProperty('token');
  });
});


// CASO 2 — Crear usuario con email duplicado
describe('Crear usuario con email duplicado', () => {
  test('Debe retornar 400 indicando que el email ya está registrado', async () => {
    // 1. Preparación de la prueba
    const usuarioEmailDuplicado = {
      nombre:           'Isabel Antonella',
      apellido_paterno: 'Rocha',
      apellido_materno: 'Vedia',
      email:            `isabel.rocha.v@${DOMINIO_PERMITIDO}`, 
      password:         'Clave1234!',
      fecha_nacimiento: '1995-06-20',
      id_rol:           2
    };

    // 2. Lógica de la Prueba
    const response = await request(app)
      .post('/api/usuarios/new')
      .set('x-token', TOKEN_VALIDO)
      .send(usuarioEmailDuplicado);

    // 3. Verificación (Assert)
    expect(response.status).toBe(400);
    expect(response.body.ok).toBe(false);
    expect(response.body.msg).toMatch(/email ya está registrado/i);
  });
});


// CASO 3 — Crear usuario con nombre completo duplicado
describe('Crear usuario con nombre completo duplicado', () => {
  test('Debe retornar 400 al intentar registrar un nombre completo ya existente', async () => {
    // 1. Preparación de la prueba
    const usuarioNombreDuplicado = {
      nombre:           'Isabel Antonella',
      apellido_paterno: 'Rocha',
      apellido_materno: 'Vedia',
      email:            `irocha@${DOMINIO_PERMITIDO}`, 
      password:         'Clave1234!',
      fecha_nacimiento: '1995-06-20',
      id_rol:           2
    };

    // 2. Lógica de la Prueba
    const response = await request(app)
      .post('/api/usuarios/new')
      .set('x-token', TOKEN_VALIDO)
      .send(usuarioNombreDuplicado);

    // 3. Verificación (Assert)
    expect(response.status).toBe(400);
    expect(response.body.ok).toBe(false);
  });
});


// CASO 4 — Crear usuario con fecha de nacimiento futura
describe('Crear usuario con fecha de nacimiento futura', () => {
  test('Debe retornar 400 indicando que la fecha no puede ser futura', async () => {
    // 1. Preparación de la prueba
    const usuarioFechaFutura = {
      nombre:           'Carlos',
      apellido_paterno: 'Mendez',
      apellido_materno: 'Vega',
      email:            `carlos.mendez@${DOMINIO_PERMITIDO}`,
      password:         'Clave1234!',
      fecha_nacimiento: '2099-01-01',
      id_rol:           1
    };

    // 2. Lógica de la Prueba
    const response = await request(app)
      .post('/api/usuarios/new')
      .set('x-token', TOKEN_VALIDO)
      .send(usuarioFechaFutura);

    // 3. Verificación (Assert)
    expect(response.status).toBe(400);
    expect(response.body.ok).toBe(false);
    expect(response.body.msg).toMatch(/fecha de nacimiento/i);
  });
});


// CASO 5 — Obtener lista de usuarios paginada
describe('Obtener lista de usuarios paginada', () => {
  test('Debe retornar 200 con la lista de usuarios y datos de paginación que son 5 por página', async () => {
    // 1. Preparación de la prueba
    const page  = 1;
    const limit = 5;

    // 2. Lógica de la Prueba
    const response = await request(app)
      .get(`/api/usuarios?page=${page}&limit=${limit}`)
      .set('x-token', TOKEN_VALIDO);

    // 3. Verificación (Assert)
    expect(response.status).toBe(200);
    expect(response.body.ok).toBe(true);
    expect(response.body).toHaveProperty('usuarios');
    expect(response.body).toHaveProperty('totalItems');
    expect(response.body).toHaveProperty('totalPages');
    expect(response.body.currentPage).toBe(page);
    expect(Array.isArray(response.body.usuarios)).toBe(true);
  });
});