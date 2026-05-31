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

});
