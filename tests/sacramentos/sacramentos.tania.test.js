/**
 * Pruebas unitarias — Módulo de Sacramentos
 *
 * Lenguaje:  JavaScript (Node.js)
 * Framework: Jest 29
 *
 * Archivos bajo prueba:
 *   - controllers/sacramentos.js
 *       getSacramento              → busca un sacramento activo por ID
 *       crearSacramento            → inserta un nuevo sacramento en BD
 *       actualizarSacramento       → edita campos de un sacramento existente
 *       eliminarSacramento         → baja lógica (activo = false)
 *       getSacramentos             → lista paginada con filtros
 *
 * Cada prueba sigue la estructura AAA:
 *   1) PREPARACIÓN  — datos de entrada y mocks
 *   2) LÓGICA       — invocación de la función bajo prueba
 *   3) VERIFICACIÓN — asserts sobre la respuesta
 */

// ─── Mocks de modelos y servicios ────────────────────────────────────────────
// Se usan factory functions para evitar que el código de asociaciones
// de Sequelize se ejecute al cargar los modelos reales.
jest.mock('../../models/Sacramento', () => ({
  findOne:         jest.fn(),
  findAndCountAll: jest.fn(),
  create:          jest.fn(),
}));
jest.mock('../../models/TipoSacramento',   () => ({}));
jest.mock('../../models/Parroquia',        () => ({}));
jest.mock('../../models/Usuario',          () => ({}));
jest.mock('../../models/PersonaSacramento', () => ({ findAll: jest.fn() }));
jest.mock('../../models/Persona',          () => ({ findAll: jest.fn() }));
jest.mock('../../models/RolSacramento',    () => ({}));
jest.mock('../../models/MatrimonioDetalle', () => ({ findOne: jest.fn() }));
jest.mock('../../middlewares/busqueda', () => ({
  combinarCondiciones: jest.fn().mockReturnValue({}),
}));
jest.mock('../../services/sacramento.service', () => ({
  crearSacramentoCompletoService: jest.fn(),
  actualizarSacramentoCompletoService: jest.fn(),
}));

const Sacramento = require('../../models/Sacramento');
const {
  getSacramento,
  crearSacramento,
  actualizarSacramento,
  eliminarSacramento,
  getSacramentos,
} = require('../../controllers/sacramentos');

// ─── Helper: objeto res simulado ─────────────────────────────────────────────
const mockRes = () => {
  const res = { locals: {} };
  res.status = jest.fn().mockReturnValue(res);
  res.json   = jest.fn().mockReturnValue(res);
  return res;
};

// ─────────────────────────────────────────────────────────────────────────────
describe('Módulo de Sacramentos — Pruebas unitarias (Tania)', () => {

  afterEach(() => jest.clearAllMocks());

  // ══════════════════════════════════════════════════════════════════════════
  // PRUEBA 1 — getSacramento: sacramento encontrado exitosamente
  // ══════════════════════════════════════════════════════════════════════════
  test('PRUEBA 1 — getSacramento devuelve 200 y el sacramento cuando el ID existe', async () => {

    // 1) PREPARACIÓN
    //    Se define el sacramento de prueba que el modelo debe devolver
    const sacramentoFalso = {
      id_sacramento: 1,
      fecha_sacramento: '2024-01-15',
      foja: 'A',
      numero: 10,
      activo: true,
    };

    Sacramento.findOne = jest.fn().mockResolvedValue(sacramentoFalso);

    const req = { params: { id: '1' } };
    const res = mockRes();

    // 2) LÓGICA
    //    Se llama a la función del controlador con los parámetros preparados
    await getSacramento(req, res);

    // 3) VERIFICACIÓN
    //    La respuesta debe contener ok:true y los datos del sacramento
    expect(Sacramento.findOne).toHaveBeenCalledWith({
      where: { id_sacramento: '1', activo: true },
    });
    expect(res.json).toHaveBeenCalledWith({
      ok: true,
      sacramento: sacramentoFalso,
    });
    expect(res.status).not.toHaveBeenCalled();
  });

  // ══════════════════════════════════════════════════════════════════════════
  // PRUEBA 2 — getSacramento: sacramento no encontrado (404)
  // ══════════════════════════════════════════════════════════════════════════
  test('PRUEBA 2 — getSacramento devuelve 404 cuando el ID no existe', async () => {

    // 1) PREPARACIÓN
    //    El modelo retorna null, simulando que no hay registro con ese ID
    Sacramento.findOne = jest.fn().mockResolvedValue(null);

    const req = { params: { id: '999' } };
    const res = mockRes();

    // 2) LÓGICA
    await getSacramento(req, res);

    // 3) VERIFICACIÓN
    //    Debe responder con status 404 y mensaje de error
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({
      ok: false,
      msg: 'Sacramento no encontrado',
    });
  });

  // ══════════════════════════════════════════════════════════════════════════
  // PRUEBA 3 — crearSacramento: creación exitosa (201)
  // ══════════════════════════════════════════════════════════════════════════
  test('PRUEBA 3 — crearSacramento devuelve 201 con el sacramento creado', async () => {

    // 1) PREPARACIÓN
    //    Body con los campos mínimos necesarios para crear un sacramento
    const bodyNuevo = {
      fecha_sacramento: '2024-06-01',
      foja: 'B',
      numero: 5,
      usuario_id_usuario: 1,
      institucion_parroquia_id_parroquia: 2,
      tipo_sacramento_id_tipo: 1,
    };

    const sacramentoCreado = { id_sacramento: 42, ...bodyNuevo };
    Sacramento.create = jest.fn().mockResolvedValue(sacramentoCreado);

    const req = { body: bodyNuevo };
    const res = mockRes();

    // 2) LÓGICA
    await crearSacramento(req, res);

    // 3) VERIFICACIÓN
    //    Debe llamar a Sacramento.create con los datos del body y responder 201
    expect(Sacramento.create).toHaveBeenCalledWith(bodyNuevo);
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({
      ok: true,
      sacramento: sacramentoCreado,
    });
  });

  // ══════════════════════════════════════════════════════════════════════════
  // PRUEBA 4 — actualizarSacramento: ID inválido (400)
  // ══════════════════════════════════════════════════════════════════════════
  test('PRUEBA 4 — actualizarSacramento devuelve 400 cuando el ID no es numérico', async () => {

    // 1) PREPARACIÓN
    //    Se envía un ID no numérico para provocar la validación del controlador
    const req = { params: { id: 'abc' }, body: { foja: 'C' } };
    const res = mockRes();

    // 2) LÓGICA
    await actualizarSacramento(req, res);

    // 3) VERIFICACIÓN
    //    Debe rechazar con 400 sin llegar a consultar la base de datos
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ ok: false, msg: 'ID inválido' });
    expect(Sacramento.findOne).not.toHaveBeenCalled();
  });

  // ══════════════════════════════════════════════════════════════════════════
  // PRUEBA 5 — eliminarSacramento: baja lógica exitosa
  // ══════════════════════════════════════════════════════════════════════════
  test('PRUEBA 5 — eliminarSacramento desactiva el registro y responde 200', async () => {

    // 1) PREPARACIÓN
    //    El modelo retorna un sacramento activo con el método update disponible
    const sacramentoActivo = {
      id_sacramento: 3,
      activo: true,
      update: jest.fn().mockResolvedValue(true),
    };

    Sacramento.findOne = jest.fn().mockResolvedValue(sacramentoActivo);

    const req = { params: { id: '3' } };
    const res = mockRes();

    // 2) LÓGICA
    await eliminarSacramento(req, res);

    // 3) VERIFICACIÓN
    //    El campo activo debe cambiar a false (baja lógica) y la respuesta ser 200
    expect(sacramentoActivo.update).toHaveBeenCalledWith({ activo: false });
    expect(res.json).toHaveBeenCalledWith({
      ok: true,
      msg: 'Sacramento eliminado correctamente',
    });
    expect(res.status).not.toHaveBeenCalled();
  });

  // ══════════════════════════════════════════════════════════════════════════
  // PRUEBA 6 — getSacramento: error interno (500)
  // ══════════════════════════════════════════════════════════════════════════
  test('PRUEBA 6 — getSacramento devuelve 500 cuando la base de datos lanza un error', async () => {

    // 1) PREPARACIÓN
    //    Se simula que findOne lanza una excepción inesperada
    Sacramento.findOne = jest.fn().mockRejectedValue(new Error('DB caída'));

    const req = { params: { id: '1' } };
    const res = mockRes();

    // 2) LÓGICA
    await getSacramento(req, res);

    // 3) VERIFICACIÓN
    //    El controlador debe capturar el error y responder 500
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      ok: false,
      msg: 'Error al obtener sacramento',
    });
  });

  // ══════════════════════════════════════════════════════════════════════════
  // PRUEBA 7 — crearSacramento: error interno en BD (500)
  // ══════════════════════════════════════════════════════════════════════════
  test('PRUEBA 7 — crearSacramento devuelve 500 cuando Sacramento.create falla', async () => {

    // 1) PREPARACIÓN
    //    Se simula un fallo al persistir en la base de datos
    Sacramento.create = jest.fn().mockRejectedValue(new Error('Error de BD'));

    const req = {
      body: {
        fecha_sacramento: '2024-06-01',
        foja: 'C',
        numero: 3,
        usuario_id_usuario: 1,
        institucion_parroquia_id_parroquia: 2,
        tipo_sacramento_id_tipo: 1,
      },
    };
    const res = mockRes();

    // 2) LÓGICA
    await crearSacramento(req, res);

    // 3) VERIFICACIÓN
    //    Debe responder con 500 y mensaje de error genérico
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      ok: false,
      msg: 'Error al crear el sacramento',
    });
  });

  // ══════════════════════════════════════════════════════════════════════════
  // PRUEBA 8 — actualizarSacramento: sacramento no encontrado (404)
  // ══════════════════════════════════════════════════════════════════════════
  test('PRUEBA 8 — actualizarSacramento devuelve 404 cuando el sacramento no existe', async () => {

    // 1) PREPARACIÓN
    //    El ID es numérico válido pero no hay registro activo con ese ID
    Sacramento.findOne = jest.fn().mockResolvedValue(null);

    const req = { params: { id: '99' }, body: { foja: 'Z' } };
    const res = mockRes();

    // 2) LÓGICA
    await actualizarSacramento(req, res);

    // 3) VERIFICACIÓN
    //    Debe responder 404 sin intentar actualizar nada
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ ok: false, msg: 'Sacramento no encontrado' });
  });

  // ══════════════════════════════════════════════════════════════════════════
  // PRUEBA 9 — actualizarSacramento: body sin campos editables (400)
  // ══════════════════════════════════════════════════════════════════════════
  test('PRUEBA 9 — actualizarSacramento devuelve 400 cuando el body no trae campos a actualizar', async () => {

    // 1) PREPARACIÓN
    //    El sacramento existe pero el body viene vacío (sin ningún campo actualizable)
    const sacramentoExistente = {
      id_sacramento: 7,
      activo: true,
      update: jest.fn(),
    };

    Sacramento.findOne = jest.fn().mockResolvedValue(sacramentoExistente);

    const req = { params: { id: '7' }, body: {} };
    const res = mockRes();

    // 2) LÓGICA
    await actualizarSacramento(req, res);

    // 3) VERIFICACIÓN
    //    El controlador detecta que no hay nada que actualizar y rechaza con 400
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      ok: false,
      msg: 'No se enviaron campos a actualizar',
    });
    expect(sacramentoExistente.update).not.toHaveBeenCalled();
  });

  // ══════════════════════════════════════════════════════════════════════════
  // PRUEBA 10 — getSacramentos: listado paginado exitoso (200)
  // ══════════════════════════════════════════════════════════════════════════
  test('PRUEBA 10 — getSacramentos devuelve 200 con la lista paginada de sacramentos', async () => {

    // 1) PREPARACIÓN
    //    Se simulan dos sacramentos devueltos por findAndCountAll
    const filas = [
      { id_sacramento: 1, foja: 'A', numero: 1 },
      { id_sacramento: 2, foja: 'B', numero: 2 },
    ];

    Sacramento.findAndCountAll = jest.fn().mockResolvedValue({
      count: 2,
      rows: filas,
    });

    const req = { query: { page: '1', limit: '10' } };
    const res = mockRes();

    // 2) LÓGICA
    await getSacramentos(req, res);

    // 3) VERIFICACIÓN
    //    La respuesta debe incluir ok:true, los datos y los metadatos de paginación
    expect(Sacramento.findAndCountAll).toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        ok: true,
        sacramentos: filas,
        totalItems: 2,
        totalPages: 1,
        currentPage: 1,
      })
    );
    expect(res.status).not.toHaveBeenCalled();
  });

});
