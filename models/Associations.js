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
const ActivoInformacion     = require('./ActivoInformacion');
const VulnerabilidadAmenaza = require('./VulnerabilidadAmenaza');
const Riesgo                = require('./Riesgo');
const RiesgoVulnerabilidad  = require('./RiesgoVulnerabilidad');
const Control               = require('./Control');

Modulo.hasMany(Permisos,  { foreignKey: 'id_modulo', as: 'permisos' });
Permisos.belongsTo(Modulo, { foreignKey: 'id_modulo', as: 'modulo' });

// ── MatrizRiesgo (legacy) ─────────────────────────────────────────────────────
MatrizRiesgo.belongsTo(Usuario, { foreignKey: 'usuario_id', as: 'usuario' });
Usuario.hasMany(MatrizRiesgo,   { foreignKey: 'usuario_id', as: 'riesgos' });

// ── ActivoInformacion ─────────────────────────────────────────────────────────
ActivoInformacion.belongsTo(Usuario, { foreignKey: 'usuario_id', as: 'usuario' });
Usuario.hasMany(ActivoInformacion,   { foreignKey: 'usuario_id', as: 'activos_informacion' });

// ── VulnerabilidadAmenaza ─────────────────────────────────────────────────────
VulnerabilidadAmenaza.belongsTo(Usuario, { foreignKey: 'usuario_id', as: 'usuario' });
Usuario.hasMany(VulnerabilidadAmenaza,   { foreignKey: 'usuario_id', as: 'vulnerabilidades_amenazas' });

// ── Riesgo ────────────────────────────────────────────────────────────────────
Riesgo.belongsTo(ActivoInformacion, { foreignKey: 'activo_id', as: 'activoInfo' });
ActivoInformacion.hasMany(Riesgo,   { foreignKey: 'activo_id', as: 'riesgos' });

Riesgo.belongsTo(Usuario, { foreignKey: 'usuario_id', as: 'usuario' });
Usuario.hasMany(Riesgo,   { foreignKey: 'usuario_id', as: 'riesgos_creados' });

// Riesgo ↔ VulnerabilidadAmenaza (M:N via junction)
Riesgo.belongsToMany(VulnerabilidadAmenaza, {
  through:    RiesgoVulnerabilidad,
  foreignKey: 'riesgo_id',
  otherKey:   'vulnerabilidad_id',
  as:         'vulnerabilidades',
});
VulnerabilidadAmenaza.belongsToMany(Riesgo, {
  through:    RiesgoVulnerabilidad,
  foreignKey: 'vulnerabilidad_id',
  otherKey:   'riesgo_id',
  as:         'riesgos',
});

// ── Control ───────────────────────────────────────────────────────────────────
Control.belongsTo(Riesgo,   { foreignKey: 'riesgo_id', as: 'riesgo' });
Riesgo.hasMany(Control,     { foreignKey: 'riesgo_id', as: 'controles' });

Control.belongsTo(Usuario,  { foreignKey: 'usuario_id', as: 'usuario' });
Usuario.hasMany(Control,    { foreignKey: 'usuario_id', as: 'controles_creados' });

// ── Resto de asociaciones ─────────────────────────────────────────────────────
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
  ActivoInformacion,
  VulnerabilidadAmenaza,
  Riesgo,
  RiesgoVulnerabilidad,
  Control,
].forEach(registrarHooks);
