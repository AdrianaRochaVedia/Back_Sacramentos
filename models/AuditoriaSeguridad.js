const { DataTypes } = require('sequelize');
const { sequelize } = require('../database/config');

const AuditoriaSeguridad = sequelize.define('AuditoriaSeguridad', {
  id_log:           { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true },
  fecha:            { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
  username:         { type: DataTypes.STRING(150), allowNull: true },
  evento:           { 
    type: DataTypes.STRING(50), allowNull: false,
    // LOGIN_OK | LOGIN_FAIL | LOGOUT | PASSWORD_CHANGE | TOKEN_REFRESH | ACCESS_DENIED
  },
  exitoso:          { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
  ip_address:       { type: DataTypes.STRING, allowNull: true },
  user_agent:       { type: DataTypes.TEXT, allowNull: true },
  detalle:          { type: DataTypes.TEXT, allowNull: true }, // razón del fallo, etc.
  correlation_id:   { type: DataTypes.STRING(100), allowNull: true },
  application_name: { type: DataTypes.STRING(120), allowNull: true },
  created_at:       { type: DataTypes.DATE, allowNull: true, defaultValue: DataTypes.NOW },
}, {
  tableName: 'auditoria_seguridad',
  timestamps: false,
});

module.exports = AuditoriaSeguridad;