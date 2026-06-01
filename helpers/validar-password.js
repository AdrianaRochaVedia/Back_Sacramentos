const ConfiguracionSeguridad = require('../models/ConfiguracionSeguridad');

const passwordFuerte = async (valor) => {
  const config = await ConfiguracionSeguridad.findOne({
    where: { activo: true }
  });

  if (!config) {
    throw new Error('No hay configuración de seguridad registrada, contacte al administrador');
  }

  const errores = [];

  if (valor.length < config.longitud_minima) {
    errores.push(`Mínimo ${config.longitud_minima} caracteres`);
  }

  if (valor.length > config.longitud_maxima) {
    errores.push(`Máximo ${config.longitud_maxima} caracteres`);
  }

  if (config.requiere_mayuscula && !/[A-Z]/.test(valor)) {
    errores.push('Debe contener al menos una mayúscula');
  }

  if (config.requiere_minuscula && !/[a-z]/.test(valor)) {
    errores.push('Debe contener al menos una minúscula');
  }

  if (config.requiere_numero && !/[0-9]/.test(valor)) {
    errores.push('Debe contener al menos un número');
  }

  if (
    config.requiere_caracter_especial &&
    !/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(valor)
  ) {
    errores.push('Debe contener al menos un carácter especial');
  }

  if (errores.length > 0) {
    throw new Error(errores.join('. '));
  }

  return true;
};

module.exports = { passwordFuerte };