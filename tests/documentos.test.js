const request = require('supertest');
const app = require('../app');

describe('Documentos', () => {
  let token;
  let documentoId;

  beforeAll(async () => {
    const res = await request(app)
      .post('/api/usuarios')
      .send({
        correo: 'juan@test.com',
        contrasenia: 'StrongPass123!'
      });
    token = res.body.token;
  });

  it('Debe crear un documento', async () => {
  const res = await request(app)
    .post('/api/documentos')
    .set('x-token', token)
    .send({
      nombre: 'Constitución',
      tipo: 'Legal',
      fuente_origen: 'Gobierno',
      descripcion: 'Documento constitucional',
      importancia: 'Alta',
      enlace: 'http://constitucion.gob.bo',
      anio_publicacion: '2009-01-25',
      concepto_basico: 'Derechos y deberes',
      aplicacion: 'Todos los ciudadanos',
      cpe: 'Sí',
      jerarquia: 'Alta'
    });

  expect(res.statusCode).toBe(201);
  documentoId = res.body.documento.id_documento; // <- aquí el campo correcto
});


  it('Debe obtener el documento creado', async () => {
    const res = await request(app).get(`/api/documentos/${documentoId}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.documento.nombre).toBe('Constitución');
  });

  it('Debe eliminar lógicamente el documento', async () => {
    const res = await request(app)
      .patch(`/api/documentos/${documentoId}`)
      .set('x-token', token);
    expect(res.statusCode).toBe(200);
  });
});
