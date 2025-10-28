const { passwordFuerte } = require('../helpers/validar-password');

describe('Validación de contraseña fuerte', () => {
  test('Debería aceptar una contraseña fuerte válida', () => {
    const contraseñaValida = 'Admin123!';
    expect(passwordFuerte(contraseñaValida)).toBe(true);
  });

  test('Debería rechazar una contraseña sin símbolos', () => {
    const contraseñaSinSimbolos = 'Admin123';
    expect(() => passwordFuerte(contraseñaSinSimbolos)).toThrow(
      'La contraseña debe tener al menos 8 caracteres, una mayúscula, una minúscula, un número y un símbolo'
    );
  });

  test('Debería rechazar una contraseña corta', () => {
    const contraseñaCorta = 'A1!';
    expect(() => passwordFuerte(contraseñaCorta)).toThrow();
  });

  test('Debería rechazar una contraseña sin mayúsculas', () => {
    const sinMayus = 'admin123!';
    expect(() => passwordFuerte(sinMayus)).toThrow();
  });

  test('Debería rechazar una contraseña sin minúsculas', () => {
    const sinMinus = 'ADMIN123!';
    expect(() => passwordFuerte(sinMinus)).toThrow();
  });

  test('Debería rechazar una contraseña sin números', () => {
    const sinNumero = 'AdminTest!';
    expect(() => passwordFuerte(sinNumero)).toThrow();
  });
});
