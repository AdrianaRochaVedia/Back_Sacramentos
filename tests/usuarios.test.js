const request = require('supertest');
const app = require('../app'); // importa tu app de Express

describe('Autenticación', () => {
  let token = '';

  it('Debe registrar un nuevo usuario', async () => {
    const res = await request(app)
      .post('/api/usuarios/new')
      .send({
        nombre: 'Juan6 Test ',
        correo: 'juan6@test.com',
        contrasenia: 'StrongPass123!',
        tipo: 'admin'
      });

    expect(res.statusCode).toBe(201);
  });

  it('Debe iniciar sesión', async () => {
    const res = await request(app)
      .post('/api/usuarios')
      .send({
        correo: 'juan4@test.com',
        contrasenia: 'StrongPass123!'
      });

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('token');
    token = res.body.token;
  });
});
