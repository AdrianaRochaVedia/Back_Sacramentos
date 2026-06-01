const request = require('supertest');
const { app } = require('../../index');
const { sequelize } = require('../../database/config');
const Usuario = require('../../models/Usuario');
const { TOKEN_VALIDO, DOMINIO_PERMITIDO } = require('../config');

//Variables para pruebas
const ID_USUARIO_EXISTENTE    = 24;
const ID_USUARIO_INEXISTENTE  = 999999;
let ID_USUARIO_A_ELIMINAR;
let ID_USUARIO_A_DESBLOQUEAR;

beforeAll(async () => {
  await sequelize.authenticate();

  await Usuario.destroy({ where: { email: `isabel.rocha.v@${DOMINIO_PERMITIDO}` } });
  await Usuario.destroy({ where: { email: `jesus.rocha@${DOMINIO_PERMITIDO}` } });
  await Usuario.destroy({ where: { email: `irene.rocha@${DOMINIO_PERMITIDO}` } });
  await Usuario.destroy({
    where: { nombre: 'Isabel Antonella', apellido_paterno: 'Rocha', apellido_materno: 'Vedia' }
  });

  // Crea usuario para eliminar
  const usuarioEliminar = await Usuario.create({
    nombre: 'Jesus', apellido_paterno: 'Rocha', apellido_materno: 'Vedia',
    email: `jesus.rocha@${DOMINIO_PERMITIDO}`,
    password: 'Admin123456#', 
    fecha_nacimiento: '1990-01-01',
    activo: true
  });
  ID_USUARIO_A_ELIMINAR = usuarioEliminar.id_usuario;

  // Crea usuario para el caso 9 (desbloquear)
  const usuarioDesbloquear = await Usuario.create({
    nombre: 'Irene', apellido_paterno: 'Rocha', apellido_materno: 'Vedia',
    email: `irene.rocha@${DOMINIO_PERMITIDO}`,
    password: 'Admin123456#',
    fecha_nacimiento: '1990-01-01',
    activo: true
  });
  ID_USUARIO_A_DESBLOQUEAR = usuarioDesbloquear.id_usuario;

}, 30000);

afterAll(async () => {
  await Usuario.destroy({ where: { email: `isabel.rocha.v@${DOMINIO_PERMITIDO}` } });
  await Usuario.destroy({ where: { email: `test.eliminar@${DOMINIO_PERMITIDO}` } });
  await Usuario.destroy({ where: { email: `test.desbloquear@${DOMINIO_PERMITIDO}` } });
  await sequelize.close();
}, 30000); 



// PRUEBA 1 — Crear usuario con datos válidos
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


// PRUEBA — Crear usuario con email duplicado
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


// PRUEBA 3 — Crear usuario con nombre completo duplicado
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


// PRUEBA 4 — Crear usuario con fecha de nacimiento futura
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


// PRUEBA 5 — Obtener lista de usuarios paginada
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


// PRUEBA 6 — Obtener usuario por ID existente
describe('Obtener usuario por ID existente', () => {
  test('Debe retornar 200 y los datos del usuario', async () => {
    // 1. Preparación de la prueba
    const idBuscado = ID_USUARIO_EXISTENTE;
 
    // 2. Lógica de la Prueba
    const response = await request(app)
      .get(`/api/usuarios/${idBuscado}`)
      .set('x-token', TOKEN_VALIDO);
 
    // 3. Verificación (Assert)
    expect(response.status).toBe(200);
    expect(response.body.ok).toBe(true);
    expect(response.body.usuario).toHaveProperty('id_usuario', idBuscado);
  });
});
 
 
// PRUEBA 7 — Obtener usuario por ID inexistente
describe('Obtener usuario por ID inexistente', () => {
  test('Debe retornar 404 indicando que el usuario no fue encontrado', async () => {
    // 1. Preparación de la prueba
    const idInexistente = ID_USUARIO_INEXISTENTE;
 
    // 2. Lógica de la Prueba
    const response = await request(app)
      .get(`/api/usuarios/${idInexistente}`)
      .set('x-token', TOKEN_VALIDO);
 
    // 3. Verificación (Assert)
    expect(response.status).toBe(404);
    expect(response.body.ok).toBe(false);
    expect(response.body.msg).toMatch(/no encontrado/i);
  });
});


// PRUEBA 8 — Eliminar usuario existente
describe('Eliminar usuario existente', () => {
  test('Debe retornar 200 confirmando que el usuario fue eliminado', async () => {
    // 1. Preparación de la prueba
    const idEliminar = ID_USUARIO_A_ELIMINAR;
 
    // 2. Lógica de la Prueba
    const response = await request(app)
      .patch(`/api/usuarios/${idEliminar}`)
      .set('x-token', TOKEN_VALIDO);
 
    // 3. Verificación (Assert)
    expect(response.status).toBe(200);
    expect(response.body.ok).toBe(true);
    expect(response.body.msg).toMatch(/eliminado/i);
  });
});
 
 
// PRUEBA 9 — Desbloquear usuario
describe('Desbloquear usuario bloqueado', () => {
  test('Debe retornar 200 confirmando que el usuario fue desbloqueado', async () => {
    // 1. Preparación de la prueba
    const idDesbloquear = ID_USUARIO_A_DESBLOQUEAR;
 
    // 2. Lógica de la Prueba
    const response = await request(app)
      .post(`/api/usuarios/desbloquear/${idDesbloquear}`)
      .set('x-token', TOKEN_VALIDO);
 
    // 3. Verificación (Assert)
    expect(response.status).toBe(200);
    expect(response.body.ok).toBe(true);
    expect(response.body.msg).toMatch(/desbloqueado/i);
  });
});
 
 
// PRUEBA 10 — Crear usuario sin campos obligatorios
describe('Crear usuario sin campos obligatorios', () => {
  test('Debe retornar 400 indicando que faltan campos requeridos', async () => {
    // 1. Preparación de la prueba
    const usuarioIncompleto = {
      email:    `irocha@${DOMINIO_PERMITIDO}`,
      password: 'Admin1234!'
    };
 
    // 2. Lógica de la Prueba
    const response = await request(app)
      .post('/api/usuarios/new')
      .set('x-token', TOKEN_VALIDO)
      .send(usuarioIncompleto);
 
    // 3. Verificación (Assert)
    expect(response.status).toBe(400);
    expect(response.body.ok).toBe(false);
  });
});

