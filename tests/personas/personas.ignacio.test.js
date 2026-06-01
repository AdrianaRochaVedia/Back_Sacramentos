/**
 * Pruebas unitarias — Módulo de Personas
 *
 * Lenguaje:  JavaScript (Node.js)
 * Framework: Jest 29
 *
 * Archivos bajo prueba:
 *   - controllers/persona.js
 *       getPersonas                    → lista paginada con filtros de búsqueda
 *       getAllPersonas                  → lista paginada incluyendo eliminados
 *       getPersona                     → busca una persona activa por ID
 *       crearPersona                   → inserta una nueva persona en BD
 *       actualizarPersona              → edita campos de una persona existente
 *       eliminarPersona                → baja lógica (activo = false)
 *
 * Cada prueba sigue la estructura AAA:
 *   1) PREPARACIÓN  — datos de entrada y mocks
 *   2) LÓGICA       — invocación de la función bajo prueba
 *   3) VERIFICACIÓN — asserts sobre la respuesta
 */

// ─── Mocks de modelos y dependencias ─────────────────────────────────────────
jest.mock('../../models/Persona', () => ({
  findOne:         jest.fn(),
  findAndCountAll: jest.fn(),
  findAll:         jest.fn(),
  create:          jest.fn(),
}));

jest.mock('../../models/PersonaSacramento', () => ({}));
jest.mock('../../models/RolSacramento',     () => ({}));

jest.mock('../../utils/sacramentos', () => ({
  Bautizo: { excluir: ['BAUTIZADO'], requeridos: [] },
  Comunion: { excluir: ['CONFIRMADO'], requeridos: ['BAUTIZADO'] },
}));

jest.mock('../../utils/rolesSacramentos', () => ({
  padrino: { requeridos: ['BAUTIZADO'], excluir: [] },
}));

jest.mock('../../middlewares/busqueda', () => ({
  combinarCondiciones: jest.fn().mockReturnValue({}),
}));

const Persona = require('../../models/Persona');

const {
  getPersonas,
  getAllPersonas,
  getPersona,
  crearPersona,
  actualizarPersona,
  eliminarPersona,
  buscarPersonasParaSacramento,
} = require('../../controllers/persona');

// ─── Helper: mock de response de Express ────────────────────────────────────
const mockRes = () => {
  const res = { locals: {} };
  res.status = jest.fn().mockReturnValue(res);
  res.json   = jest.fn().mockReturnValue(res);
  return res;
};

// ─────────────────────────────────────────────────────────────────────────────
describe('Módulo de Personas — Pruebas unitarias', () => {

  // Silencia los console.error que el propio controller imprime en catch blocks.
  // Las pruebas siguen verificando que se devuelva el status/json correcto;
  // solo se evita el ruido visual en la salida de Jest.
  beforeAll(() => jest.spyOn(console, 'error').mockImplementation(() => {}));
  afterAll(()  => console.error.mockRestore());

  afterEach(() => jest.clearAllMocks());

  // ══════════════════════════════════════════════════════════════════════════
  // getPersonas
  // ══════════════════════════════════════════════════════════════════════════

  test('PRUEBA 1 — getPersonas devuelve 200 con lista paginada de personas activas', async () => {

    // 1) PREPARACIÓN
    const filas = [
      { id_persona: 1, nombre: 'Juan', apellido_paterno: 'Pérez', activo: true },
      { id_persona: 2, nombre: 'Ana',  apellido_paterno: 'López', activo: true },
    ];
    Persona.findAndCountAll.mockResolvedValue({ count: 2, rows: filas });
    const req = { query: { page: '1', limit: '10' } };
    const res = mockRes();

    // 2) LÓGICA
    await getPersonas(req, res);

    // 3) VERIFICACIÓN
    expect(Persona.findAndCountAll).toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      ok: true,
      personas: filas,
      totalItems: 2,
      totalPages: 1,
      currentPage: 1,
    }));
    expect(res.status).not.toHaveBeenCalled();
  });

  test('PRUEBA 2 — getPersonas devuelve 500 cuando la base de datos lanza un error', async () => {

    // 1) PREPARACIÓN
    Persona.findAndCountAll.mockRejectedValue(new Error('DB connection failed'));
    const req = { query: {} };
    const res = mockRes();

    // 2) LÓGICA
    await getPersonas(req, res);

    // 3) VERIFICACIÓN
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      ok: false,
      msg: 'Error al obtener las personas',
    }));
  });

  // ══════════════════════════════════════════════════════════════════════════
  // getAllPersonas
  // ══════════════════════════════════════════════════════════════════════════

  test('PRUEBA 3 — getAllPersonas devuelve 200 incluyendo personas inactivas', async () => {

    // 1) PREPARACIÓN
    const todasLasPersonas = [
      { id_persona: 1, nombre: 'Juan', activo: true  },
      { id_persona: 2, nombre: 'Ana',  activo: false },
    ];
    Persona.findAndCountAll.mockResolvedValue({ count: 2, rows: todasLasPersonas });
    const req = { query: { page: '1', limit: '10' } };
    const res = mockRes();

    // 2) LÓGICA
    await getAllPersonas(req, res);

    // 3) VERIFICACIÓN
    expect(Persona.findAndCountAll).toHaveBeenCalledWith(
      expect.objectContaining({ offset: 0, limit: 10 })
    );
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      ok: true,
      personas: todasLasPersonas,
      totalItems: 2,
    }));
  });

  // ══════════════════════════════════════════════════════════════════════════
  // getPersona
  // ══════════════════════════════════════════════════════════════════════════

  test('PRUEBA 4 — getPersona devuelve 200 con los datos de la persona encontrada', async () => {

    // 1) PREPARACIÓN
    const personaMock = { id_persona: 5, nombre: 'Carlos', apellido_paterno: 'Soria', activo: true };
    Persona.findOne.mockResolvedValue(personaMock);
    const req = { params: { id: '5' } };
    const res = mockRes();

    // 2) LÓGICA
    await getPersona(req, res);

    // 3) VERIFICACIÓN
    expect(Persona.findOne).toHaveBeenCalledWith({
      where: { id_persona: '5', activo: true },
    });
    expect(res.json).toHaveBeenCalledWith({ ok: true, persona: personaMock });
  });

  test('PRUEBA 5 — getPersona devuelve 404 cuando la persona no existe o está inactiva', async () => {

    // 1) PREPARACIÓN
    Persona.findOne.mockResolvedValue(null);
    const req = { params: { id: '99' } };
    const res = mockRes();

    // 2) LÓGICA
    await getPersona(req, res);

    // 3) VERIFICACIÓN
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ ok: false, msg: 'Persona no encontrada' });
  });

  // ══════════════════════════════════════════════════════════════════════════
  // crearPersona
  // ══════════════════════════════════════════════════════════════════════════

  test('PRUEBA 6 — crearPersona devuelve 201 con los datos de la persona creada', async () => {

    // 1) PREPARACIÓN
    const bodyNuevo = {
      nombre:            'Luis',
      apellido_paterno:  'Mamani',
      apellido_materno:  'Mamani',
      carnet_identidad:  '7654321',
      fecha_nacimiento:  '1990-05-20',
      lugar_nacimiento:  'La Paz',
      nombre_padre:      'Pedro Mamani',
      nombre_madre:      'Rosa Mamani',
      estado:            'soltero',
    };
    Persona.findOne.mockResolvedValue(null); // carnet no duplicado
    const personaCreada = { id_persona: 10, ...bodyNuevo };
    Persona.create.mockResolvedValue(personaCreada);
    const req = { body: bodyNuevo };
    const res = mockRes();

    // 2) LÓGICA
    await crearPersona(req, res);

    // 3) VERIFICACIÓN
    expect(Persona.create).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      ok: true,
      persona: expect.objectContaining({ id_persona: 10, nombre: 'Luis' }),
    }));
  });

  test('PRUEBA 7 — crearPersona devuelve 400 si el carnet de identidad ya está registrado', async () => {

    // 1) PREPARACIÓN
    const personaExistente = { id_persona: 3, carnet_identidad: '1234567' };
    Persona.findOne.mockResolvedValue(personaExistente);
    const req = { body: { carnet_identidad: '1234567', nombre: 'Duplicado' } };
    const res = mockRes();

    // 2) LÓGICA
    await crearPersona(req, res);

    // 3) VERIFICACIÓN
    expect(Persona.create).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      ok: false,
      msg: 'El carnet de identidad ya está registrado',
    });
  });

  test('PRUEBA 8 — crearPersona devuelve 400 si la fecha de nacimiento es futura', async () => {

    // 1) PREPARACIÓN
    Persona.findOne.mockResolvedValue(null); // carnet libre
    const req = {
      body: {
        nombre:           'Futuro',
        apellido_paterno: 'Test',
        carnet_identidad: '9999999',
        fecha_nacimiento: '2099-01-01', // fecha futura
      },
    };
    const res = mockRes();

    // 2) LÓGICA
    await crearPersona(req, res);

    // 3) VERIFICACIÓN
    expect(Persona.create).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      ok: false,
      msg: 'La fecha de nacimiento no puede ser una fecha futura',
    });
  });

  // ══════════════════════════════════════════════════════════════════════════
  // actualizarPersona
  // ══════════════════════════════════════════════════════════════════════════

  test('PRUEBA 9 — actualizarPersona devuelve 200 con los datos actualizados', async () => {

    // 1) PREPARACIÓN
    const datosPlanos = {
      id_persona: 7, nombre: 'Mario', apellido_paterno: 'Quispe',
      carnet_identidad: '5050505', activo: true,
    };
    const personaMock = {
      ...datosPlanos,
      update: jest.fn().mockResolvedValue({
        get: jest.fn().mockReturnValue({ ...datosPlanos, nombre: 'Mario Actualizado' }),
      }),
    };
    Persona.findOne.mockResolvedValue(personaMock);
    const req = { params: { id: '7' }, body: { nombre: 'Mario Actualizado' } };
    const res = mockRes();

    // 2) LÓGICA
    await actualizarPersona(req, res);

    // 3) VERIFICACIÓN
    expect(personaMock.update).toHaveBeenCalledWith({ nombre: 'Mario Actualizado' });
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ ok: true }));
  });

  test('PRUEBA 10 — actualizarPersona devuelve 404 cuando la persona no existe', async () => {

    // 1) PREPARACIÓN
    Persona.findOne.mockResolvedValue(null);
    const req = { params: { id: '999' }, body: { nombre: 'Nadie' } };
    const res = mockRes();

    // 2) LÓGICA
    await actualizarPersona(req, res);

    // 3) VERIFICACIÓN
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ ok: false, msg: 'Persona no encontrada' });
  });

  // ══════════════════════════════════════════════════════════════════════════
  // eliminarPersona
  // ══════════════════════════════════════════════════════════════════════════

  test('PRUEBA 11 — eliminarPersona realiza baja lógica y responde 200', async () => {

    // 1) PREPARACIÓN
    const personaActiva = {
      id_persona: 4,
      activo: true,
      update: jest.fn().mockResolvedValue(true),
    };
    Persona.findOne.mockResolvedValue(personaActiva);
    const req = { params: { id: '4' } };
    const res = mockRes();

    // 2) LÓGICA
    await eliminarPersona(req, res);

    // 3) VERIFICACIÓN
    expect(personaActiva.update).toHaveBeenCalledWith({ activo: false });
    expect(res.json).toHaveBeenCalledWith({ ok: true, msg: 'Persona eliminada correctamente' });
    expect(res.status).not.toHaveBeenCalled();
  });

  test('PRUEBA 12 — eliminarPersona devuelve 404 si la persona no existe o ya fue eliminada', async () => {

    // 1) PREPARACIÓN
    Persona.findOne.mockResolvedValue(null);
    const req = { params: { id: '88' } };
    const res = mockRes();

    // 2) LÓGICA
    await eliminarPersona(req, res);

    // 3) VERIFICACIÓN
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ ok: false, msg: 'Persona no encontrada' });
  });


});