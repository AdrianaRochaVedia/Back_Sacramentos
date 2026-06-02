const { DataTypes } = require('sequelize');
const { sequelize } = require('../database/config');

const RiesgoVulnerabilidad = sequelize.define('RiesgoVulnerabilidad', {
  id:                 { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  riesgo_id:          { type: DataTypes.INTEGER, allowNull: false },
  vulnerabilidad_id:  { type: DataTypes.INTEGER, allowNull: false },
}, {
  tableName:  'riesgo_vulnerabilidades',
  timestamps: false,
});

module.exports = RiesgoVulnerabilidad;
