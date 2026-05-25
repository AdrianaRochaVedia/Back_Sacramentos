const { DataTypes } = require('sequelize');
const { sequelize } = require('../database/config');

const AuditoriaAplicacion = sequelize.define('AuditoriaAplicacion', {
  id_log:           { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true },
  fecha_inicio:     { type: DataTypes.DATE, allowNull: false },
  fecha_fin:        { type: DataTypes.DATE, allowNull: false },
  duracion_ms:      { type: DataTypes.DOUBLE, allowNull: false },
  username:         { type: DataTypes.STRING(150), allowNull: true },
  http_method:      { type: DataTypes.STRING(10), allowNull: false },
  http_status:      { type: DataTypes.INTEGER, allowNull: false },
  url:              { type: DataTypes.TEXT, allowNull: false },
  entidad:          { type: DataTypes.STRING(100), allowNull: true }, // 'Usuario', 'Orden', etc.
  accion:           { type: DataTypes.STRING(50), allowNull: true },  // CREATE | UPDATE | DELETE | READ
  dato_anterior:    { type: DataTypes.JSONB, allowNull: true },       // snapshot antes del cambio
  dato_nuevo:       { type: DataTypes.JSONB, allowNull: true },       // snapshot después del cambio
  campos_modificados: { type: DataTypes.JSONB, allowNull: true },     // diff de campos
  application_name: { type: DataTypes.STRING(120), allowNull: true },
  ip_address:       { type: DataTypes.STRING, allowNull: true },
  correlation_id:   { type: DataTypes.STRING(100), allowNull: true },
  has_exception:    { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
  user_agent:       { type: DataTypes.TEXT, allowNull: true },
  mensaje:          { type: DataTypes.TEXT, allowNull: true },
  request_body:     { type: DataTypes.JSONB, allowNull: true },
  created_at:       { type: DataTypes.DATE, allowNull: true, defaultValue: DataTypes.NOW },
}, {
  tableName: 'auditoria_aplicacion',
  timestamps: false,
});

module.exports = AuditoriaAplicacion;