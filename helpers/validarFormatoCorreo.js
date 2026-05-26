
function normalizar(str) {
  return (str || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // quita tildes
    .replace(/\s+/g, '.')            // espacios → punto (nombres compuestos)
    .trim();
}

function validarFormatoCorreo({ email, nombre, apellido_paterno, apellido_materno }) {
  if (!email || !nombre || !apellido_paterno) {
    return { ok: false, msg: 'Faltan datos para validar el formato del correo' };
  }

  const [localPart, dominio] = email.split('@');
  if (!localPart || !dominio) {
    return { ok: false, msg: 'Formato de correo inválido' };
  }

  const nombreNorm   = normalizar(nombre.trim().split(/\s+/)[0]);
  const apellidoNorm = normalizar(apellido_paterno.trim().split(/\s+/)[0]);
  const inicialMaterno = apellido_materno
    ? normalizar(apellido_materno).charAt(0)
    : null;

  const localNorm = normalizar(localPart);

  const formatoBase      = `${nombreNorm}.${apellidoNorm}`;
  const formatoConInicial = inicialMaterno
    ? `${nombreNorm}.${apellidoNorm}.${inicialMaterno}`
    : null;

  const esBase      = localNorm === formatoBase;
  const esConInicial = formatoConInicial ? localNorm === formatoConInicial : false;

  if (!esBase && !esConInicial) {
    const ejemploBase      = `${formatoBase}@${dominio}`;
    const ejemploConInicial = formatoConInicial ? `${formatoConInicial}@${dominio}` : null;

    return {
      ok: false,
      msg: `El correo debe tener el formato ${ejemploBase}${ejemploConInicial ? ` o ${ejemploConInicial}` : ''}`,
    };
  }

  return { ok: true };
}

module.exports = { validarFormatoCorreo };