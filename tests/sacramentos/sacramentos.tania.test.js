/**
 * Pruebas unitarias — Módulo de Sacramentos
 *
 * Lenguaje:  JavaScript (Node.js)
 * Framework: Jest 29
 *
 * Archivos bajo prueba:
 *   - controllers/sacramentos.js
 *       getSacramento                        → busca un sacramento activo por ID
 *       getSacramentos                       → lista paginada con filtros
 *       crearSacramento                      → inserta un nuevo sacramento en BD
 *       actualizarSacramento                 → edita campos de un sacramento existente
 *       eliminarSacramento                   → baja lógica (activo = false)
 *       crearSacramentoCompleto              → crea sacramento con todas sus relaciones
 *       actualizarSacramentoCompleto         → actualiza sacramento con todas sus relaciones
 *       buscarSacramentosPorPersona          → busca sacramentos filtrando por persona
 *       getSacramentoCompleto                → obtiene un sacramento con todas sus relaciones
 *
 * Cada prueba sigue la estructura AAA:
 *   1) PREPARACIÓN  — datos de entrada y mocks
 *   2) LÓGICA       — invocación de la función bajo prueba
 *   3) VERIFICACIÓN — asserts sobre la respuesta
 */

// ─── Mocks de modelos y servicios ────────────────────────────────────────────
jest.mock('../../models/Sacramento', () => ({
  findOne:         jest.fn(),
  findAndCountAll: jest.fn(),
  create:          jest.fn(),
  sequelize: { transaction: jest.fn() },
}));
jest.mock('../../models/TipoSacramento',    () => ({}));
jest.mock('../../models/Parroquia',         () => ({}));
jest.mock('../../models/Usuario',           () => ({}));
jest.mock('../../models/PersonaSacramento', () => ({ findAll: jest.fn() }));
jest.mock('../../models/Persona',           () => ({ findAll: jest.fn() }));
jest.mock('../../models/RolSacramento',     () => ({}));
jest.mock('../../models/MatrimonioDetalle', () => ({ findOne: jest.fn() }));
jest.mock('../../middlewares/busqueda', () => ({
  combinarCondiciones: jest.fn().mockReturnValue({}),
}));
jest.mock('../../services/sacramento.service', () => ({
  crearSacramentoCompletoService:    jest.fn(),
  actualizarSacramentoCompletoService: jest.fn(),
}));

const Sacramento        = require('../../models/Sacramento');
const PersonaSacramento = require('../../models/PersonaSacramento');
const MatrimonioDetalle = require('../../models/MatrimonioDetalle');
const {
  crearSacramentoCompletoService,
  actualizarSacramentoCompletoService,
} = require('../../services/sacramento.service');

const {
  getSacramento,
  getSacramentos,
  crearSacramento,
  actualizarSacramento,
  eliminarSacramento,
  crearSacramentoCompleto,
  actualizarSacramentoCompleto,
  buscarSacramentosPorPersona,
  getSacramentoCompleto,
} = require('../../controllers/sacramentos');

// ─── Helpers ─────────────────────────────────────────────────────────────────
const mockRes = () => {
  const res = { locals: {} };
  res.status = jest.fn().mockReturnValue(res);
  res.json   = jest.fn().mockReturnValue(res);
  return res;
};

const mockTx = () => ({
  commit:   jest.fn().mockResolvedValue(undefined),
  rollback: jest.fn().mockResolvedValue(undefined),
});

// ─────────────────────────────────────────────────────────────────────────────
describe('Módulo de Sacramentos — Pruebas unitarias (Tania)', () => {

  afterEach(() => jest.clearAllMocks());

// ══════════════════════════════════════════════════════════════════════════
  // getSacramentoCompleto
  // ══════════════════════════════════════════════════════════════════════════

  test('PRUEBA 33 — getSacramentoCompleto devuelve 200 con el sacramento y sus relaciones', async () => {

    // 1) PREPARACIÓN
    const sacramentoMock = {
      id_sacramento: 1,
      fecha_sacramento: '2024-01-15',
      foja: 'A',
      numero: 10,
      tipoSacramento: { id_tipo: 1, nombre: 'Bautismo' },
      parroquia:      { id_parroquia: 1, nombre: 'San Pedro' },
      usuario:        { id_usuario: 1, nombre: 'Admin' },
      personaSacramentos: [
        {
          id_persona_sacramento: 1,
          carnet_identidad: '12345',
          persona: { id_persona: 5, nombre: 'Juan', apellido_paterno: 'Pérez', apellido_materno: 'López' },
          rol:     { id_rol_sacra: 1, nombre: 'Bautizado' },
        },
      ],
    };
    Sacramento.findOne.mockResolvedValue(sacramentoMock);
    MatrimonioDetalle.findOne.mockResolvedValue(null);

    const req = { params: { id: '1' } };
    const res = mockRes();

    // 2) LÓGICA
    await getSacramentoCompleto(req, res);

    // 3) VERIFICACIÓN
    const payload = res.json.mock.calls[0][0];
    expect(payload.ok).toBe(true);
    expect(payload.sacramento.id_sacramento).toBe(1);
    expect(payload.sacramento.relaciones).toHaveLength(1);
    expect(payload.sacramento.relaciones[0].nombre_completo).toBe('Juan Pérez López');
    expect(payload.sacramento.matrimonioDetalle).toBeNull();
  });

  // ══════════════════════════════════════════════════════════════════════════
  // getSacramentos
  // ══════════════════════════════════════════════════════════════════════════

  test('PRUEBA 2 — getSacramentos devuelve 200 con la lista paginada de sacramentos', async () => {

    // 1) PREPARACIÓN
    const filas = [{ id_sacramento: 1, foja: 'A' }, { id_sacramento: 2, foja: 'B' }];
    Sacramento.findAndCountAll.mockResolvedValue({ count: 2, rows: filas });
    const req = { query: { page: '1', limit: '10' } };
    const res = mockRes();

    // 2) LÓGICA
    await getSacramentos(req, res);

    // 3) VERIFICACIÓN
    expect(Sacramento.findAndCountAll).toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      ok: true, sacramentos: filas, totalItems: 2, totalPages: 1, currentPage: 1,
    }));
    expect(res.status).not.toHaveBeenCalled();
  });

  // ══════════════════════════════════════════════════════════════════════════
  // crearSacramento
  // ══════════════════════════════════════════════════════════════════════════

  test('PRUEBA 3 — crearSacramento devuelve 201 con el sacramento creado', async () => {

    // 1) PREPARACIÓN
    const bodyNuevo = {
      fecha_sacramento: '2024-06-01',
      foja: 'B',
      numero: 5,
      usuario_id_usuario: 1,
      institucion_parroquia_id_parroquia: 2,
      tipo_sacramento_id_tipo: 1,
    };
    const sacramentoCreado = { id_sacramento: 42, ...bodyNuevo };
    Sacramento.create.mockResolvedValue(sacramentoCreado);
    const req = { body: bodyNuevo };
    const res = mockRes();

    // 2) LÓGICA
    await crearSacramento(req, res);

    // 3) VERIFICACIÓN
    expect(Sacramento.create).toHaveBeenCalledWith(bodyNuevo);
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({ ok: true, sacramento: sacramentoCreado });
  });

  // ══════════════════════════════════════════════════════════════════════════
  // actualizarSacramento
  // ══════════════════════════════════════════════════════════════════════════

  test('PRUEBA 4 — actualizarSacramento devuelve 200 con el sacramento actualizado', async () => {

    // 1) PREPARACIÓN
    const datosActualizados = { id_sacramento: 5, foja: 'X', numero: 1 };
    const sacramentoMock = {
      id_sacramento: 5,
      activo: true,
      update: jest.fn().mockResolvedValue({ get: jest.fn().mockReturnValue(datosActualizados) }),
    };
    Sacramento.findOne.mockResolvedValue(sacramentoMock);
    const req = { params: { id: '5' }, body: { foja: 'X' } };
    const res = mockRes();

    // 2) LÓGICA
    await actualizarSacramento(req, res);

    // 3) VERIFICACIÓN
    expect(sacramentoMock.update).toHaveBeenCalledWith({ foja: 'X' });
    expect(res.json).toHaveBeenCalledWith({ ok: true, sacramento: datosActualizados });
  });

  test('PRUEBA 5 — actualizarSacramento devuelve 404 cuando el sacramento no existe', async () => {

    // 1) PREPARACIÓN
    Sacramento.findOne.mockResolvedValue(null);
    const req = { params: { id: '99' }, body: { foja: 'Z' } };
    const res = mockRes();

    // 2) LÓGICA
    await actualizarSacramento(req, res);

    // 3) VERIFICACIÓN
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ ok: false, msg: 'Sacramento no encontrado' });
  });

  // ══════════════════════════════════════════════════════════════════════════
  // eliminarSacramento
  // ══════════════════════════════════════════════════════════════════════════

  test('PRUEBA 6 — eliminarSacramento desactiva el registro y responde 200', async () => {

    // 1) PREPARACIÓN
    const sacramentoActivo = { id_sacramento: 3, activo: true, update: jest.fn().mockResolvedValue(true) };
    Sacramento.findOne.mockResolvedValue(sacramentoActivo);
    const req = { params: { id: '3' } };
    const res = mockRes();

    // 2) LÓGICA
    await eliminarSacramento(req, res);

    // 3) VERIFICACIÓN
    expect(sacramentoActivo.update).toHaveBeenCalledWith({ activo: false });
    expect(res.json).toHaveBeenCalledWith({ ok: true, msg: 'Sacramento eliminado correctamente' });
    expect(res.status).not.toHaveBeenCalled();
  });

  // ══════════════════════════════════════════════════════════════════════════
  // crearSacramentoCompleto
  // ══════════════════════════════════════════════════════════════════════════

  test('PRUEBA 7 — crearSacramentoCompleto devuelve 401 cuando no hay usuario autenticado', async () => {

    // 1) PREPARACIÓN
    const t = mockTx();
    Sacramento.sequelize.transaction.mockResolvedValue(t);
    const req = { uid: undefined, body: {} };
    const res = mockRes();

    // 2) LÓGICA
    await crearSacramentoCompleto(req, res);

    // 3) VERIFICACIÓN
    expect(t.rollback).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ ok: false, msg: 'Usuario no autenticado' });
  });

  test('PRUEBA 8 — crearSacramentoCompleto devuelve 201 con el sacramento creado', async () => {

    // 1) PREPARACIÓN
    const t = mockTx();
    Sacramento.sequelize.transaction.mockResolvedValue(t);
    const sacramento = { id_sacramento: 10 };
    crearSacramentoCompletoService.mockResolvedValue(sacramento);
    const req = { uid: 1, body: { fecha_sacramento: '2024-01-01' } };
    const res = mockRes();

    // 2) LÓGICA
    await crearSacramentoCompleto(req, res);

    // 3) VERIFICACIÓN
    expect(t.commit).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({
      ok: true,
      msg: 'Sacramento creado correctamente',
      sacramento,
    });
  });

  // ══════════════════════════════════════════════════════════════════════════
  // actualizarSacramentoCompleto
  // ══════════════════════════════════════════════════════════════════════════

  test('PRUEBA 9 — actualizarSacramentoCompleto devuelve 200 con actualización exitosa', async () => {

    // 1) PREPARACIÓN
    const t = mockTx();
    Sacramento.sequelize.transaction.mockResolvedValue(t);
    actualizarSacramentoCompletoService.mockResolvedValue(undefined);
    const req = { uid: 1, params: { id: '5' }, body: { foja: 'D' } };
    const res = mockRes();

    // 2) LÓGICA
    await actualizarSacramentoCompleto(req, res);

    // 3) VERIFICACIÓN
    expect(t.commit).toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith({
      ok: true,
      msg: 'Sacramento actualizado correctamente',
      id_sacramento: '5',
    });
  });

  // ══════════════════════════════════════════════════════════════════════════
  // buscarSacramentosPorPersona
  // ══════════════════════════════════════════════════════════════════════════

  test('PRUEBA 10 — buscarSacramentosPorPersona devuelve 400 si falta tipo_sacramento_id_tipo', async () => {

    // 1) PREPARACIÓN
    const req = { query: {} };
    const res = mockRes();

    // 2) LÓGICA
    await buscarSacramentosPorPersona(req, res);

    // 3) VERIFICACIÓN
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ ok: false, msg: 'Debe enviar tipo_sacramento_id_tipo' });
  });

  

});
