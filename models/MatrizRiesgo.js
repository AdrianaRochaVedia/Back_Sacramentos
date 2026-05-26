const { DataTypes } = require('sequelize');
const { sequelize } = require('../database/config');
 
const MatrizRiesgo = sequelize.define('MatrizRiesgo', {
  id_riesgo:                  { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  numero:                     { type: DataTypes.INTEGER, allowNull: false },
  activo_info:                { type: DataTypes.STRING(200), allowNull: false },
  amenaza_vulnerabilidad:     { type: DataTypes.TEXT, allowNull: false },
  consecuencia:               { type: DataTypes.TEXT, allowNull: false },
  probabilidad_inherente:     { type: DataTypes.SMALLINT, allowNull: false },
  impacto_inherente:          { type: DataTypes.SMALLINT, allowNull: false },
  nivel_riesgo_inherente:     { type: DataTypes.VIRTUAL, get() {
    const v = this.probabilidad_inherente * this.impacto_inherente;
    if (v <= 4)  return 'Bajo';
    if (v <= 9)  return 'Moderado';
    if (v <= 16) return 'Alto';
    return 'Extremo';
  }},
  tratamiento:                { type: DataTypes.STRING(50), defaultValue: 'Reducir' },
  controles:                  { type: DataTypes.TEXT, allowNull: false },
  tipo_control:               { type: DataTypes.STRING(10) },
  nivel_control:              { type: DataTypes.STRING(5) },
  frecuencia_control:         { type: DataTypes.STRING(10) },
  probabilidad_residual:      { type: DataTypes.SMALLINT, allowNull: false },
  impacto_residual:           { type: DataTypes.SMALLINT, allowNull: false },
  nivel_riesgo_residual:      { type: DataTypes.VIRTUAL, get() {
    const v = this.probabilidad_residual * this.impacto_residual;
    if (v <= 4)  return 'Bajo';
    if (v <= 9)  return 'Moderado';
    if (v <= 16) return 'Alto';
    return 'Extremo';
  }},
  activo:                     { type: DataTypes.BOOLEAN, defaultValue: true },
  usuario_id:                 { type: DataTypes.INTEGER },
}, {
  tableName: 'matriz_riesgos',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
});
 
module.exports = MatrizRiesgo;
