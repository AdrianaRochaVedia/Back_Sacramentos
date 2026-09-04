const MESES = {
  enero:'01', febrero:'02', marzo:'03', abril:'04',
  mayo:'05', junio:'06', julio:'07', agosto:'08',
  septiembre:'09', octubre:'10', noviembre:'11', diciembre:'12'
};

// Normaliza espacios DENTRO de cada línea sin fusionar líneas entre sí.
// El salto de línea que pone Textract entre el nombre de la parroquia y su
// dirección es justamente lo que evita que la regex de parroquia se trague
// la dirección — por eso esto se mantiene separado de aplanarTexto().
const normalizarLineas = (texto = '') =>
  texto
    .replace(/\r\n/g, '\n')
    .split('\n')
    .map((l) => l.replace(/\s+/g, ' ').trim())
    .filter(Boolean)
    .join('\n');

// Colapsa saltos de línea y espacios repetidos que introduce Textract al unir
// los bloques LINE — solo para campos que necesitan poder cruzar de una línea
// a otra (fechas narrativas, nombres seguidos de "nacido" en la siguiente línea).
const aplanarTexto = (texto = '') => normalizarLineas(texto).replace(/\n/g, ' ');

// Corta el nombre de la parroquia apenas aparece algo que ya es dirección
// (calle, número de puerta, teléfono, etc.), para no arrastrarla como si
// fuera parte del nombre — pasa incluso si Textract puso todo en una sola línea.
const cortarEnDireccion = (texto = '') =>
  texto
    .split(/\s+(?:Av\.?|Avenida|Calle|Jr\.?|Zona|N[°º]\s*\d|Diocesis|Di[oó]cesis|Foja|N[uú]mero|Tel[eé]fono|Cel\.?|Acta|Libro)\b/i)[0]
    .replace(/[,.\-\s]+$/, '')
    .trim();

// Extrae el nombre de parroquia de un texto CON saltos de línea preservados
// (usar normalizarLineas, no aplanarTexto) — "." no cruza "\n" en JS por
// defecto, así que esto solo captura hasta el final de esa línea.
const extraerParroquia = (textoLineas) => {
  const match = textoLineas.match(/Parroquia[:\s]+(.+)/i);
  if (!match) return null;
  const nombre = cortarEnDireccion(match[1]);
  return nombre || null;
};

// Fallback de fecha en formato simple dd/mm/aaaa o dd-mm-aaaa, para documentos
// que no usan la redacción narrativa ("a los X días del mes de Y del año...").
const extraerFechaSimple = (texto) => {
  const match = texto.match(/(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/);
  if (!match) return null;
  const [, d, m, y] = match;
  return `${d.padStart(2, '0')}/${m.padStart(2, '0')}/${y}`;
};

const extraerFechaNarrativa = (texto) => {
  // Los paréntesis vienen con espacio adentro ("( 2025 )") cuando se llena a
  // mano en un formulario impreso, aunque en las actas digitales salgan
  // pegados ("(2025)") — por eso el \s* alrededor de cada dígito.
  const fechaNarrativaMatch = texto.match(/d[ií]as del mes de (\w+) del año[^(]+\(\s*(\d{4})\s*\)/i);
  if (!fechaNarrativaMatch) return null;

  const mes = MESES[fechaNarrativaMatch[1].toLowerCase()] || '01';
  const anio = fechaNarrativaMatch[2];
  // No se ancla a "a los" + una sola palabra: la palabra escrita a mano para
  // el día ("dos", "veinte"...) puede salir partida o con ruido de OCR: lo
  // único confiable es el número entre paréntesis justo antes de "días".
  const diaMatch = texto.match(/\(\s*(\d{1,2})\s*\)\s*d[ií]as/i);
  const dia = diaMatch ? diaMatch[1].padStart(2, '0') : '01';

  return `${dia}/${mes}/${anio}`;
};

// Fecha larga tipo "nacido el 01 de Enero de 2006" (sin paréntesis, distinta
// de la fecha narrativa del sacramento). Trabaja sobre texto ya aplanado.
const extraerFechaLarga = (texto, prefijoRegex) => {
  const match = texto.match(prefijoRegex);
  if (!match) return null;
  const [, dia, mesTexto, anio] = match;
  const mes = MESES[mesTexto.toLowerCase()];
  if (!mes) return null;
  return `${dia.padStart(2, '0')}/${mes}/${anio}`;
};

const extraerFechaDiaMesAnio = (texto) => {
  // Igual que en extraerFechaNarrativa: la palabra del día escrita a mano
  // puede salir partida en varios tokens por ruido de OCR, así que se tolera
  // un tramo corto de palabras entre "día" y el número entre paréntesis.
  const diaMatch = texto.match(/d[ií]a\s+[\w\s]{0,20}?\(\s*(\d{1,2})\s*\)/i);
  const mesAnioMatch = texto.match(/de\s+(\w+)\s+del\s+año[^(]+\(\s*(\d{4})\s*\)/i);
  if (!diaMatch || !mesAnioMatch) return null;

  const dia = diaMatch[1].padStart(2, '0');
  const mes = MESES[mesAnioMatch[1].toLowerCase()] || '01';
  const anio = mesAnioMatch[2];
  return `${dia}/${mes}/${anio}`;
};

// Marca qué campos vino con dato real vs cuáles quedaron vacíos, para que el
// frontend pueda distinguir "esto lo detectó el OCR" de "esto hay que llenarlo a mano".
const construirConfianza = (datos) =>
  Object.fromEntries(
    Object.entries(datos).map(([campo, valor]) => [campo, valor !== null && valor !== ''])
  );

const parsers = {
  bautismo: (textoOriginal) => {
    const texto = aplanarTexto(textoOriginal);
    const datos = {
      fecha_sacramento: null, foja: null, numero: null, nombre: null, parroquia: null,
      fecha_nacimiento: null, lugar_nacimiento: null, nombre_padre: null, nombre_madre: null
    };

    datos.parroquia = extraerParroquia(normalizarLineas(textoOriginal));

    const fojaMatch = texto.match(/Foja:\s*([A-Za-z0-9\-]+)/i);
    if (fojaMatch) datos.foja = fojaMatch[1].trim();

    const numeroMatch = texto.match(/N[uú]mero:\s*(\d+)/i);
    if (numeroMatch) datos.numero = numeroMatch[1];

    // El formulario en blanco imprime "nacido(a)" (neutro, para llenar a mano
    // sin tener que elegir versión) mientras que las actas ya rellenadas dicen
    // "nacido" o "nacida" a secas — el (?:\([oa]\))? cubre ambos casos.
    const nombreMatch = texto.match(/Nombre del bautizado:\s*(.+?)\s*,?\s*nacid[oa](?:\([oa]\))?/i);
    if (nombreMatch) datos.nombre = nombreMatch[1].trim();

    datos.fecha_sacramento = extraerFechaNarrativa(texto) || extraerFechaSimple(texto);

    // "...nacido/nacida(a) el 01 de Enero de 2006 en La Paz, Bolivia." — el
    // documento ya trae esto; antes se descartaba tras extraer el nombre,
    // y además solo reconocía la forma masculina "nacido" (nunca "nacida").
    datos.fecha_nacimiento = extraerFechaLarga(
      texto,
      /nacid[oa](?:\([oa]\))?\s+el\s+(\d{1,2})\s+de\s+(\w+)\s+de\s+(\d{4})/i
    );

    // Corta en el punto final si existe, y si no (el formulario en blanco no
    // siempre trae uno detectable) corta apenas empieza "Hijo(a)" para no
    // arrastrar el resto del acta como si fuera el lugar de nacimiento.
    const lugarNacMatch = texto.match(
      /nacid[oa](?:\([oa]\))?\s+el\s+\d{1,2}\s+de\s+\w+\s+de\s+\d{4}\s+en\s+(.+?)(?:\.|\s+[Hh]ij[oa])/i
    );
    if (lugarNacMatch) datos.lugar_nacimiento = lugarNacMatch[1].trim();

    // "Hijo(a) legítimo(a) de X [y] de Y..." — la "y" se hace opcional porque
    // Textract a veces la detecta fuera de orden en el texto (agrupa por
    // posición en la imagen, no por lectura humana) y se pierde de esta zona.
    const padresMatch = texto.match(
      /[Hh]ij[oa](?:\([oa]\))?\s+(?:leg[ií]tim[oa](?:\([oa]\))?|natural)?\s*de\s+(.+?)\s*(?:y\s+)?de\s+(.+?)(?:,\s*domiciliad|\.\s|\.$)/i
    );
    if (padresMatch) {
      datos.nombre_padre = padresMatch[1].trim();
      datos.nombre_madre = padresMatch[2].trim();
    }

    datos._confianza = construirConfianza(datos);
    return datos;
  },

  confirmacion: (textoOriginal) => {
    const texto = aplanarTexto(textoOriginal);
    const datos = { fecha_sacramento: null, foja: null, numero: null, nombre: null, parroquia: null };

    datos.parroquia = extraerParroquia(normalizarLineas(textoOriginal));

    const fojaMatch = texto.match(/Foja:\s*([A-Za-z0-9\-]+)/i);
    if (fojaMatch) datos.foja = fojaMatch[1].trim();

    const numeroMatch = texto.match(/N[uú]mero:\s*(\d+)/i);
    if (numeroMatch) datos.numero = numeroMatch[1];

    const nombreMatch = texto.match(/Nombre del confirmado:\s*(.+?)\s*,?\s*nacid[ao]/i);
    if (nombreMatch) datos.nombre = nombreMatch[1].trim();

    datos.fecha_sacramento = extraerFechaDiaMesAnio(texto) || extraerFechaSimple(texto);

    datos._confianza = construirConfianza(datos);
    return datos;
  },

  primeracomunion: (textoOriginal) => {
    const texto = aplanarTexto(textoOriginal);
    const datos = { fecha_sacramento: null, foja: null, numero: null, nombre: null, parroquia: null };

    datos.parroquia = extraerParroquia(normalizarLineas(textoOriginal));

    const fojaMatch = texto.match(/Foja:\s*([A-Za-z0-9\-]+)/i);
    if (fojaMatch) datos.foja = fojaMatch[1].trim();

    const numeroMatch = texto.match(/N[uú]mero:\s*(\d+)/i);
    if (numeroMatch) datos.numero = numeroMatch[1];

    const nombreMatch = texto.match(/Nombre del comulgado:\s*(.+?)\s*,?\s*nacid[ao]/i);
    if (nombreMatch) datos.nombre = nombreMatch[1].trim();

    datos.fecha_sacramento = extraerFechaDiaMesAnio(texto) || extraerFechaSimple(texto);

    datos._confianza = construirConfianza(datos);
    return datos;
  },

  matrimonio: (textoOriginal) => {
    const textoFlat = aplanarTexto(textoOriginal);

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

    const parroquiaLineaMatch = normalizarLineas(textoOriginal).match(/[PD]arroquia\s+(.+)/i);
    const parroquiaMatch =
      (parroquiaLineaMatch && cortarEnDireccion(parroquiaLineaMatch[1])) ||
      (textoFlat.match(/[PD]arroquia\s+(.+?)(?=\s+Av\.|\s+Acta|\s+Libro|\s+Foja|$)/i)?.[1]?.trim());
    if (parroquiaMatch) datos.parroquia = cortarEnDireccion(parroquiaMatch);

    const fojaMatch = textoFlat.match(/Foja:\s*([A-Za-z0-9\-]+)/i);
    if (fojaMatch) datos.foja = fojaMatch[1].trim();

    const numeroMatch = textoFlat.match(/N[uú]mero:\s*(\d+)/i);
    if (numeroMatch) datos.numero = numeroMatch[1];

    datos.fecha_sacramento = extraerFechaDiaMesAnio(textoFlat) || extraerFechaSimple(textoFlat);

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

    // "N.°" trae punto Y símbolo de grado a la vez (no solo uno de los dos).
    const regCivilMatch = textoFlat.match(
      /Registro Civil\s*N\.?\s*[°º]?\s*([A-Za-z0-9\/\-]+)/i
    );

    if (regCivilMatch) {
      datos.reg_civil = regCivilMatch[1].trim();
    }

    const numActaMatch = textoFlat.match(/Acta\s+N\.?\s*[°º]?\s*(\d+)/i);
    if (numActaMatch) datos.numero_acta = numActaMatch[1];

    const testigosMatch = textoFlat.match(
      /testigos?:\s*(.+?)\s+y\s+(.+?)(?=\s*,|\s*mayores|\s*\.)/i
    );

    if (testigosMatch) {
      datos.testigo1 = testigosMatch[1].trim();
      datos.testigo2 = testigosMatch[2].trim();
    }

    datos._confianza = construirConfianza(datos);
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
    return { fecha_sacramento: null, foja: null, numero: null, nombre: null, parroquia: null, _confianza: {} };
  }

  return parser(texto);
};

module.exports = { parsearSegunTipo };
