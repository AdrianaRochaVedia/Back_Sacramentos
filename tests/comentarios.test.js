const request = require('supertest');
const app = require('../app');

describe('Comentarios', () => {
  let comentarioId;

  it('Debe crear un comentario', async () => {
    const res = await request(app)
      .post('/api/comentarios')
      .send({
        DOCUMENTO_id_documento: 1,
        comentario: 'Excelente documento, muy útil para entender los derechos constitucionales.',
      });

    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toBeDefined();
    expect(res.body.data.comentario).toBe('Excelente documento, muy útil para entender los derechos constitucionales.');
    expect(res.body.data.DOCUMENTO_id_documento).toBe(1);
    comentarioId = res.body.data.id_comentario;
  });

  it('Debe obtener todos los comentarios', async () => {
    const res = await request(app).get('/api/comentarios');
    
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it('Debe obtener comentarios por documento', async () => {
    const res = await request(app).get('/api/comentarios/1/comentarios');
    
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    // Verificar que todos los comentarios pertenecen al documento 1
    res.body.data.forEach(comentario => {
      expect(comentario.DOCUMENTO_id_documento).toBe(1);
    });
  });

  it('Debe cambiar el estado de publicado del comentario', async () => {
    const res = await request(app)
      .patch(`/api/comentarios/${comentarioId}/toggle-publicado`);
    
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toBeDefined();
    expect(res.body.data.id_comentario).toBe(comentarioId);
  });

  it('Debe cambiar el estado de eliminado del comentario', async () => {
    const res = await request(app)
      .patch(`/api/comentarios/${comentarioId}/toggle-eliminado`);
    
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toBeDefined();
    expect(res.body.data.id_comentario).toBe(comentarioId);
  });

  it('Debe fallar al buscar comentario inexistente', async () => {
    const res = await request(app)
      .patch('/api/comentarios/99999/toggle-publicado');
    
    expect(res.statusCode).toBe(404);
  });


});