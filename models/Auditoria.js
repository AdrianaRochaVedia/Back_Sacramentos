const { DataTypes } = require('sequelize');
const { sequelize } = require('../database/config');

const Auditoria = sequelize.define('Auditoria', {
  id_log:           { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true },
  fecha_inicio:     { type: DataTypes.DATE, allowNull: false },
  fecha_fin:        { type: DataTypes.DATE, allowNull: false },
  duracion_ms:      { type: DataTypes.DOUBLE, allowNull: false },
  username:         { type: DataTypes.STRING(150), allowNull: true },
  http_method:      { type: DataTypes.STRING(10), allowNull: false },
  http_status:      { type: DataTypes.INTEGER, allowNull: false },
  url:              { type: DataTypes.TEXT, allowNull: false },
  application_name: { type: DataTypes.STRING(120), allowNull: true },
  ip_address:       { type: DataTypes.STRING, allowNull: true }, // PG INET, aquí string
  correlation_id:   { type: DataTypes.STRING(100), allowNull: true },
  has_exception:    { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
  user_agent:       { type: DataTypes.TEXT, allowNull: true },
  mensaje:          { type: DataTypes.TEXT, allowNull: true },
  request_body:     { type: DataTypes.JSONB, allowNull: true },
  created_at:       { type: DataTypes.DATE, allowNull: true, defaultValue: DataTypes.NOW },
}, {
  tableName: 'auditoria',
  timestamps: false,
});

module.exports = Auditoria;