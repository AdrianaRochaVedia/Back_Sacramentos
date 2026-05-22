// models/hooks/auditHooks.js
const MODELOS_AUDITADOS = [
  'Persona',
  'Usuario',
  'Sacramento',
  'Parroquia',
  'MatrimonioDetalle',
  'ConfiguracionSeguridad',
  'DominioPermitido',
  'Rol',
  'RolPermiso',
];

function registrarHooks(modelo) {
  modelo.addHook('beforeUpdate', async (instance) => {
    instance._datoAnterior = instance._previousDataValues
      ? { ...instance._previousDataValues }
      : null;
  });

  modelo.addHook('afterUpdate', async (instance) => {
    instance._datoNuevo = instance.dataValues
      ? { ...instance.dataValues }
      : null;
  });
}

module.exports = { registrarHooks, MODELOS_AUDITADOS };