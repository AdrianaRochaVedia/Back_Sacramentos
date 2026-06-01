
function normalizar(str) {
  return (str || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '') // quita tildes
    .replace(/\s+/g, '.')            // espacios → punto (nombres compuestos)
    .trim();
}

/**
 * Construye todos los formatos de correo válidos para los datos dados.
 *
 * Para "Lourdes Peredo Torrez":
 *   lourdes.peredo          → nombre completo . apellido paterno
 *   lperedo                 → inicial nombre + apellido paterno (sin punto)
 *   lourdes.peredo.t        → nombre completo . apellido paterno . inicial materno
 *   lperedo.t               → inicial nombre + apellido paterno . inicial materno
 */
function formatosValidos(nombre, apellido_paterno, apellido_materno) {
  const primerNombre   = normalizar(nombre.trim().split(/\s+/)[0]);
  const inicialNombre  = primerNombre.charAt(0);
  const apellidoNorm   = normalizar(apellido_paterno.trim().split(/\s+/)[0]);
  const inicialMaterno = apellido_materno
    ? normalizar(apellido_materno.trim()).charAt(0)
    : null;

  const formatos = [
    `${primerNombre}.${apellidoNorm}`,   // lourdes.peredo
    `${inicialNombre}${apellidoNorm}`,   // lperedo
  ];

  if (inicialMaterno) {
    formatos.push(`${primerNombre}.${apellidoNorm}.${inicialMaterno}`); // lourdes.peredo.t
    formatos.push(`${inicialNombre}${apellidoNorm}.${inicialMaterno}`); // lperedo.t
  }

  return formatos;
}

function validarFormatoCorreo({ email, nombre, apellido_paterno, apellido_materno }) {
  if (!email || !nombre || !apellido_paterno) {
    return { ok: false, msg: 'Faltan datos para validar el formato del correo' };
  }

  const [localPart, dominio] = email.split('@');
  if (!localPart || !dominio) {
    return { ok: false, msg: 'Formato de correo inválido' };
  }

  const localNorm = normalizar(localPart);
  const validos   = formatosValidos(nombre, apellido_paterno, apellido_materno);

  if (validos.includes(localNorm)) {
    return { ok: true };
  }

  const ejemplos = validos.map(f => `${f}@${dominio}`).join(', ');
  return {
    ok: false,
    msg: `El correo no corresponde a los datos ingresados. Formatos aceptados: ${ejemplos}`,
  };
}

module.exports = { validarFormatoCorreo, formatosValidos };
