const validarRelaciones = (relaciones) => {
  if (!Array.isArray(relaciones) || relaciones.length === 0) {
    throw new Error('Debe incluir al menos una relación (persona + rol)');
  }
 
  relaciones.forEach((rel, i) => {
    if (!rel.persona_id) {
      throw new Error(`Relación ${i + 1}: falta persona_id`);
    }
    if (!rel.rol_sacramento_id) {
      throw new Error(`Relación ${i + 1}: falta rol_sacramento_id`);
    }
  });
};
 
module.exports = { validarRelaciones };