const { validarJWT } = require('../middlewares/validar-jwt');
const jwt = require('jsonwebtoken');

jest.mock('jsonwebtoken');

describe('Middleware validarJWT', () => {
  let req, res, next;

  beforeEach(() => {
    req = { header: jest.fn() };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    next = jest.fn();
  });

  test('Debe devolver 401 si no hay token', () => {
    req.header.mockReturnValue(undefined);

    validarJWT(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      ok: false,
      msg: 'No hay token en la petición'
    });
    expect(next).not.toHaveBeenCalled();
  });

  test('Debe devolver 401 si el token no es válido', () => {
    req.header.mockReturnValue('token-invalido');
    jwt.verify.mockImplementation(() => { throw new Error('Token inválido') });

    validarJWT(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      ok: false,
      msg: 'Token no válido'
    });
    expect(next).not.toHaveBeenCalled();
  });

  test('Debe llamar a next() y asignar uid y correo si token es válido', () => {
    req.header.mockReturnValue('token-valido');
    jwt.verify.mockReturnValue({ uid: 123, correo: 'test@example.com' });

    validarJWT(req, res, next);

    expect(req.uid).toBe(123);
    expect(req.correo).toBe('test@example.com');
    expect(next).toHaveBeenCalled();
  });
});
