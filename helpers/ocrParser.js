const parsers = {
  // Sacramento 1 bautizo
  bautismo: (texto) => {
    const datos = { fecha_sacramento: null, foja: null, numero: null, nombre: null, parroquia: null };
    const fechaMatch = texto.match(/FECHA DE BAUTISMO:\s*(\d{1,2}\/\d{1,2}\/\d{4})/i);
    if (fechaMatch) datos.fecha_sacramento = fechaMatch[1];

    const fojaMatch = texto.match(/FOJA:\s*([A-Za-z0-9]+)/i);
    if (fojaMatch) datos.foja = fojaMatch[1];

    const numeroMatch = texto.match(/NUMERO:\s*(\d+)/i);
    if (numeroMatch) datos.numero = numeroMatch[1];

    const nombreMatch = texto.match(/NOMBRE DEL BAUTIZADO:\s*(.*?)\s*FECHA/i);
    if (nombreMatch) datos.nombre = nombreMatch[1].trim();

    const parroquiaMatch = texto.match(/PARROQUIA\s+(.+?)\s+Diocesis/i);
    if (parroquiaMatch) datos.parroquia = parroquiaMatch[1].trim();

    return datos;
  },
  // Sacramento 2 confirmacion
  confirmacion: (texto) => {
    const datos = { fecha_sacramento: null, foja: null, numero: null, nombre: null, parroquia: null };

    const fechaMatch = texto.match(/FECHA DE CONFIRMACION:\s*(\d{1,2}\/\d{1,2}\/\d{4})/i);
    if (fechaMatch) datos.fecha_sacramento = fechaMatch[1];

    const fojaMatch = texto.match(/FOJA:\s*([A-Za-z0-9]+)/i);
    if (fojaMatch) datos.foja = fojaMatch[1];

    const numeroMatch = texto.match(/NUMERO:\s*(\d+)/i);
    if (numeroMatch) datos.numero = numeroMatch[1];

    const nombreMatch = texto.match(/NOMBRE DEL CONFIRMADO:\s*(.*?)\s*FECHA/i);
    if (nombreMatch) datos.nombre = nombreMatch[1].trim();

    return datos;
  },

  //Sacramento 3 matrimonio
  matrimonio: (texto) => {
    const datos = { fecha_sacramento: null, foja: null, numero: null, nombre: null, parroquia: null };

    const fechaMatch = texto.match(/FECHA DE MATRIMONIO:\s*(\d{1,2}\/\d{1,2}\/\d{4})/i);
    if (fechaMatch) datos.fecha_sacramento = fechaMatch[1];

    const fojaMatch = texto.match(/FOJA:\s*([A-Za-z0-9]+)/i);
    if (fojaMatch) datos.foja = fojaMatch[1];

    const numeroMatch = texto.match(/NUMERO:\s*(\d+)/i);
    if (numeroMatch) datos.numero = numeroMatch[1];

    return datos;
  }
};

const tipoSacramentoMap = {
  1: 'bautismo',
  2: 'confirmacion',
  3: 'matrimonio'
};

const parsearSegunTipo = (texto, tipoSacramentoId) => {
  const clave = tipoSacramentoMap[tipoSacramentoId];
  const parser = parsers[clave];

  if (!parser) {
    return { fecha_sacramento: null, foja: null, numero: null, nombre: null, parroquia: null };
  }

  return parser(texto);
};

module.exports = { parsearSegunTipo };