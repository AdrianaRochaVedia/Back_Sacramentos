const request = require('supertest');
const app = require('../app'); // importa tu app de Express

describe('Autenticación', () => {
  let token = '';

  it('Debe registrar un nuevo usuario', async () => {
    const res = await request(app)
      .post('/api/usuarios/new')
      .send({
        nombre: 'Juan6 Test ',
        email: 'juan6@test.com',
        password: 'StrongPass123!',
        tipo: 'admin'
      });

    expect(res.statusCode).toBe(201);
  });

  it('Debe iniciar sesión', async () => {
    const res = await request(app)
      .post('/api/usuarios')
      .send({
        email: 'juan4@test.com',
        password: 'StrongPass123!'
      });

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('token');
    token = res.body.token;
  });
});
