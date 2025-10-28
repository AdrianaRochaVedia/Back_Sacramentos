const { validarCampos } = require('../middlewares/validar-campos');
const { validationResult } = require('express-validator');

// Mock de express-validator
jest.mock('express-validator', () => ({
  validationResult: jest.fn()
}));

describe('Middleware validarCampos', () => {
  let req, res, next;

  beforeEach(() => {
    req = {};
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    next = jest.fn();
  });

  test('Debe llamar a next() si no hay errores de validación', () => {
    validationResult.mockReturnValue({
      isEmpty: () => true
    });

    validarCampos(req, res, next);

    expect(next).toHaveBeenCalled();
  });

  test('Debe retornar errores si hay errores de validación', () => {
    validationResult.mockReturnValue({
      isEmpty: () => false,
      mapped: () => ({
        correo: { msg: 'El correo es obligatorio' }
      })
    });

    validarCampos(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      ok: false,
      errors: {
        correo: { msg: 'El correo es obligatorio' }
      }
    });
    expect(next).not.toHaveBeenCalled();
  });
});
