const parsers = {
  bautismo: (texto) => {
    const datos = { fecha_sacramento: null, foja: null, numero: null, nombre: null, parroquia: null };

    const parroquiaMatch = texto.match(/Parroquia\s+(.+)/i);
    if (parroquiaMatch) datos.parroquia = parroquiaMatch[1].trim();

    const fojaMatch = texto.match(/Foja:\s*([A-Za-z0-9\-]+)/i);
    if (fojaMatch) datos.foja = fojaMatch[1].trim();

    const numeroMatch = texto.match(/N[uú]mero:\s*(\d+)/i);
    if (numeroMatch) datos.numero = numeroMatch[1];

    const nombreMatch = texto.match(/Nombre del bautizado:\s*(.+?),\s*nacido/i);
    if (nombreMatch) datos.nombre = nombreMatch[1].trim();

    const fechaNarrativaMatch = texto.match(/d[ií]as del mes de (\w+) del año[^(]+\((\d{4})\)/i);
    if (fechaNarrativaMatch) {
        const meses = {
        enero:'01', febrero:'02', marzo:'03', abril:'04',
        mayo:'05', junio:'06', julio:'07', agosto:'08',
        septiembre:'09', octubre:'10', noviembre:'11', diciembre:'12'
        };
        const mes = meses[fechaNarrativaMatch[1].toLowerCase()] || '01';
        const anio = fechaNarrativaMatch[2];
        const diaMatch = texto.match(/a los \w+ \((\d{1,2})\) d[ií]as/i);
        const dia = diaMatch ? diaMatch[1].padStart(2, '0') : '01';

        datos.fecha_sacramento = `${dia}/${mes}/${anio}`;
    }

    return datos;
    },

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

    const parroquiaMatch = texto.match(/PARROQUIA\s+(.+?)\s+Diocesis/i);
    if (parroquiaMatch) datos.parroquia = parroquiaMatch[1].trim();

    return datos;
  },

  matrimonio: (texto) => {
    const datos = {
      fecha_sacramento: null,
      foja: null,
      numero: null,
      parroquia: null,
      nombre_contrayente: null,
      nombre_contrayenta: null,
      lugar_ceremonia: null,
      reg_civil: null,
      numero_acta: null,
      testigo1: null,
      testigo2: null
    };

    const fechaMatch = texto.match(/FECHA DE MATRIMONIO:\s*(\d{1,2}\/\d{1,2}\/\d{4})/i);
    if (fechaMatch) datos.fecha_sacramento = fechaMatch[1];

    const fojaMatch = texto.match(/FOJA:\s*([A-Za-z0-9]+)/i);
    if (fojaMatch) datos.foja = fojaMatch[1];

    const numeroMatch = texto.match(/NUMERO:\s*(\d+)/i);
    if (numeroMatch) datos.numero = numeroMatch[1];

    const parroquiaMatch = texto.match(/PARROQUIA\s+(.+?)\s+Diocesis/i);
    if (parroquiaMatch) datos.parroquia = parroquiaMatch[1].trim();

    const contrayentaMatch = texto.match(/NOMBRE DE LA CONTRAYENTE:\s*(.*?)(?:\n|NOMBRE)/i);
    if (contrayentaMatch) datos.nombre_contrayenta = contrayentaMatch[1].trim();

    const contrayenteMatch = texto.match(/NOMBRE DEL CONTRAYENTE:\s*(.*?)(?:\n|LUGAR)/i);
    if (contrayenteMatch) datos.nombre_contrayente = contrayenteMatch[1].trim();

    const lugarMatch = texto.match(/LUGAR DE CEREMONIA:\s*(.*?)(?:\n|REGISTRO)/i);
    if (lugarMatch) datos.lugar_ceremonia = lugarMatch[1].trim();

    const regCivilMatch = texto.match(/REGISTRO CIVIL:\s*(\d+)/i);
    if (regCivilMatch) datos.reg_civil = regCivilMatch[1];

    const numActaMatch = texto.match(/NUMERO DE ACTA:\s*(\d+)/i);
    if (numActaMatch) datos.numero_acta = numActaMatch[1];

    const testigo1Match = texto.match(/TESTIGO 1:\s*(.*?)(?:\n|TESTIGO)/i);
    if (testigo1Match) datos.testigo1 = testigo1Match[1].trim();

    const testigo2Match = texto.match(/TESTIGO 2:\s*(.*?)(?:\n|$)/i);
    if (testigo2Match) datos.testigo2 = testigo2Match[1].trim();

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