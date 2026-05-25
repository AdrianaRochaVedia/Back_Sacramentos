/**
 * Compara dos objetos y retorna solo los campos que cambiaron.
 * { campo: { anterior: valor, nuevo: valor } }
 */
function calcularDiff(anterior, nuevo) {
  if (!anterior || !nuevo) return null;

  const diff = {};
  const keys = new Set([...Object.keys(anterior), ...Object.keys(nuevo)]);

  for (const key of keys) {
    const valAnterior = anterior[key];
    const valNuevo    = nuevo[key];
    const sonIguales  = JSON.stringify(valAnterior) === JSON.stringify(valNuevo);
    if (!sonIguales) {
      diff[key] = { anterior: valAnterior, nuevo: valNuevo };
    }
  }

  return Object.keys(diff).length > 0 ? diff : null;
}

module.exports = { calcularDiff };