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

    const parroquiaMatch = texto.match(/Parroquia[:\s]+(.+?)(?:\s+Diocesis|$)/im);
    if (parroquiaMatch) datos.parroquia = parroquiaMatch[1].trim();

    const fojaMatch = texto.match(/Foja:\s*([A-Za-z0-9\-]+)/i);
    if (fojaMatch) datos.foja = fojaMatch[1].trim();

    const numeroMatch = texto.match(/N[uú]mero:\s*(\d+)/i);
    if (numeroMatch) datos.numero = numeroMatch[1];

    const nombreMatch = texto.match(/Nombre del confirmado:\s*(.+?)\s*,?\s*nacid[ao]/i);
    if (nombreMatch) datos.nombre = nombreMatch[1].trim();

    const diaMatch = texto.match(/d[ií]a\s+\w+\s+\((\d{1,2})\)/i);
    const mesAnioMatch = texto.match(/de\s+(\w+)\s+del\s+año[^(]+\((\d{4})\)/i);
    if (diaMatch && mesAnioMatch) {
        const meses = {
            enero:'01', febrero:'02', marzo:'03', abril:'04',
            mayo:'05', junio:'06', julio:'07', agosto:'08',
            septiembre:'09', octubre:'10', noviembre:'11', diciembre:'12'
        };
        const dia = diaMatch[1].padStart(2, '0');
        const mes = meses[mesAnioMatch[1].toLowerCase()] || '01';
        const anio = mesAnioMatch[2];
        datos.fecha_sacramento = `${dia}/${mes}/${anio}`;
    }

    return datos;
},

primeracomunion: (texto) => {
    const datos = { fecha_sacramento: null, foja: null, numero: null, nombre: null, parroquia: null };

    const parroquiaMatch = texto.match(/Parroquia[:\s]+(.+?)(?:\s+Diocesis|$)/im);
    if (parroquiaMatch) datos.parroquia = parroquiaMatch[1].trim();

    const fojaMatch = texto.match(/Foja:\s*([A-Za-z0-9\-]+)/i);
    if (fojaMatch) datos.foja = fojaMatch[1].trim();

    const numeroMatch = texto.match(/N[uú]mero:\s*(\d+)/i);
    if (numeroMatch) datos.numero = numeroMatch[1];

    const nombreMatch = texto.match(/Nombre del comulgado:\s*(.+?)\s*,?\s*nacid[ao]/i);
    if (nombreMatch) datos.nombre = nombreMatch[1].trim();

    const diaMatch = texto.match(/d[ií]a\s+\w+\s+\((\d{1,2})\)/i);
    const mesAnioMatch = texto.match(/de\s+(\w+)\s+del\s+año[^(]+\((\d{4})\)/i);
    if (diaMatch && mesAnioMatch) {
        const meses = {
            enero:'01', febrero:'02', marzo:'03', abril:'04',
            mayo:'05', junio:'06', julio:'07', agosto:'08',
            septiembre:'09', octubre:'10', noviembre:'11', diciembre:'12'
        };
        const dia = diaMatch[1].padStart(2, '0');
        const mes = meses[mesAnioMatch[1].toLowerCase()] || '01';
        const anio = mesAnioMatch[2];
        datos.fecha_sacramento = `${dia}/${mes}/${anio}`;
    }

    return datos;
},

  matrimonio: (texto) => {
  const textoNorm = texto.replace(/\r\n/g, '\n');
  const textoFlat = textoNorm.replace(/\n/g, ' ').replace(/\s+/g, ' ');

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

  const limpiarNombre = (nombre) =>
    nombre
      .replace(/,\s*nacid[oa].*$/i, '')
      .replace(/\s+hij[oa]\s+de.*$/i, '')
      .trim();

  const parroquiaMatch = textoFlat.match(/[PD]arroquia\s+(.+?)(?=\s+Av\.|\s+Acta|\s+Libro|\s+Foja|$)/i);
  if (parroquiaMatch) datos.parroquia = parroquiaMatch[1].trim();

  const fojaMatch = textoFlat.match(/Foja:\s*([A-Za-z0-9\-]+)/i);
  if (fojaMatch) datos.foja = fojaMatch[1].trim();

  const numeroMatch = textoFlat.match(/N[uú]mero:\s*(\d+)/i);
  if (numeroMatch) datos.numero = numeroMatch[1];

  const diaMatch = textoFlat.match(/d[ií]a\s+\w+\s+\((\d{1,2})\)/i);
  const mesAnioMatch = textoFlat.match(/de\s+(\w+)\s+del\s+año[^(]+\((\d{4})\)/i);

  if (diaMatch && mesAnioMatch) {
    const meses = {
      enero: '01', febrero: '02', marzo: '03', abril: '04',
      mayo: '05', junio: '06', julio: '07', agosto: '08',
      septiembre: '09', octubre: '10', noviembre: '11', diciembre: '12'
    };

    const dia = diaMatch[1].padStart(2, '0');
    const mes = meses[mesAnioMatch[1].toLowerCase()] || '01';
    const anio = mesAnioMatch[2];

    datos.fecha_sacramento = `${dia}/${mes}/${anio}`;
  }

  const contrayenteMatch = textoFlat.match(
    /Contrayente:\s*(.+?)(?=,\s*nacido|\s+nacido)/i
  );

  if (contrayenteMatch) {
    datos.nombre_contrayente = limpiarNombre(contrayenteMatch[1]);
  }

  const contrayentaMatch = textoFlat.match(
    /Contrayenta:\s*(.+?)(?=,\s*nacida|\s+nacida|\s+La ceremonia|\s+Actuaron|\s+El presente)/i
  );

  if (contrayentaMatch) {
    datos.nombre_contrayenta = limpiarNombre(contrayentaMatch[1]);
  }

  if (!datos.nombre_contrayenta) {
    const fallbackContrayenta = textoFlat.match(
      /Contrayenta:\s*([A-ZÁÉÍÓÚÑ][A-Za-zÁÉÍÓÚáéíóúÑñ\s]+?)(?=,\s*nacida|\s+nacida|\.|La ceremonia)/i
    );

    if (fallbackContrayenta) {
      datos.nombre_contrayenta = limpiarNombre(fallbackContrayenta[1]);
    }
  }

   const lugarMatch = textoFlat.match(
    /En la ciudad de\s+(.+?),\s*Rep[úu]blica/i
    );

    if (lugarMatch) {
    datos.lugar_ceremonia = lugarMatch[1].trim();
    }

  const regCivilMatch = textoFlat.match(
    /Registro Civil\s*N[°º]\s*([A-Za-z0-9\/\-]+)/i
    );

    if (regCivilMatch) {
    datos.reg_civil = regCivilMatch[1].trim();
    }

  const numActaMatch = textoFlat.match(/Acta\s+N[°º\.]?\s*(\d+)/i);
  if (numActaMatch) datos.numero_acta = numActaMatch[1];

  const testigosMatch = textoFlat.match(
    /testigos?:\s*(.+?)\s+y\s+(.+?)(?=\s*,|\s*mayores|\s*\.)/i
  );

  if (testigosMatch) {
    datos.testigo1 = testigosMatch[1].trim();
    datos.testigo2 = testigosMatch[2].trim();
  }

  return datos;
}
};

const tipoSacramentoMap = {
  1: 'bautismo',
  2: 'matrimonio',
  3: 'primeracomunion',
  4: 'confirmacion'
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