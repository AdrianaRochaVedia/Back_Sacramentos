const request = require('supertest');
const app = require('../app');

describe('Propuestas', () => {
  let propuestaId;

  it('Debe crear una propuesta', async () => {
    const res = await request(app)
      .post('/api/propuestas')
      .send({
        propuesta: 'Propuesta para mejorar el acceso a la educación pública en Bolivia'
      });

    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toBe('Propuesta creado exitosamente');
    expect(res.body.data).toBeDefined();
    expect(res.body.data.propuesta).toBe('Propuesta para mejorar el acceso a la educación pública en Bolivia');
    propuestaId = res.body.data.id_propuesta;
  });

  it('Debe obtener todas las propuestas', async () => {
    const res = await request(app).get('/api/propuestas');
    
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it('Debe cambiar el estado de publicado de la propuesta', async () => {
    const res = await request(app)
      .patch(`/api/propuestas/${propuestaId}/toggle-publicado`);
    
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toBe('Estado publicado actualizado');
    expect(res.body.data).toBeDefined();
    expect(res.body.data.id_propuesta).toBe(propuestaId);
    expect(res.body.data.publicado).toBe(true); // Cambió de false a true
  });

  it('Debe cambiar el estado de eliminado de la propuesta', async () => {
    const res = await request(app)
      .patch(`/api/propuestas/${propuestaId}/toggle-eliminado`);
    
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toBe('Estado eliminado actualizado');
    expect(res.body.data).toBeDefined();
    expect(res.body.data.id_comentario).toBe(propuestaId); // Nota: el controlador usa id_comentario en la respuesta
    expect(res.body.data.isDeleted).toBe(true); // Cambió de false a true
  });

  it('Debe restaurar el estado de eliminado de la propuesta', async () => {
    // Probamos el toggle una vez más para restaurar
    const res = await request(app)
      .patch(`/api/propuestas/${propuestaId}/toggle-eliminado`);
    
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.isDeleted).toBe(false); // Cambió de true a false
  });




});