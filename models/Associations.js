const { registrarHooks }    = require('./hooks/auditHooks');
const Persona               = require('./Persona');
const Usuario               = require('./Usuario');
const Rol                   = require('./Rol');
const Parroquia             = require('./Parroquia');
const UsuarioParroquia      = require('./UsuarioParroquia');
const Sacramento            = require('./Sacramento');
const MatrimonioDetalle     = require('./MatrimonioDetalle');
const ConfiguracionSeguridad = require('./ConfiguracionSeguridad');
const DominioPermitido      = require('./DominioPermitido');
const RolPermiso            = require('./RolPermiso');
const TipoSacramento        = require('./TipoSacramento');
const RolSacramento         = require('./RolSacramento');
const Permisos              = require('./Permisos');
const MatrizRiesgo          = require('./MatrizRiesgo');
const Modulo                = require('./Modulo');

Modulo.hasMany(Permisos,  { foreignKey: 'id_modulo', as: 'permisos' });
Permisos.belongsTo(Modulo, { foreignKey: 'id_modulo', as: 'modulo' });

Usuario.belongsTo(Rol,           { foreignKey: 'id_rol',        as: 'rol' });
Rol.hasMany(Usuario,             { foreignKey: 'id_rol',        as: 'usuarios' });

Usuario.belongsToMany(Parroquia, { through: UsuarioParroquia, foreignKey: 'id_usuario',  otherKey: 'id_parroquia', as: 'parroquias' });
Parroquia.belongsToMany(Usuario, { through: UsuarioParroquia, foreignKey: 'id_parroquia', otherKey: 'id_usuario',  as: 'usuarios' });

UsuarioParroquia.belongsTo(Usuario,  { foreignKey: 'id_usuario',  as: 'usuario' });
UsuarioParroquia.belongsTo(Parroquia,{ foreignKey: 'id_parroquia', as: 'parroquia' });

[
  Persona,
  Usuario,
  Rol,
  Parroquia,
  Sacramento,
  MatrimonioDetalle,
  ConfiguracionSeguridad,
  DominioPermitido,
  RolPermiso,
  TipoSacramento,
  RolSacramento,
  Permisos,
  MatrizRiesgo,
  Modulo,
].forEach(registrarHooks);
