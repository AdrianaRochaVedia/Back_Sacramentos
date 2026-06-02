const { DataTypes } = require('sequelize');
const { sequelize } = require('../database/config');

const Riesgo = sequelize.define('Riesgo', {
  id_riesgo:               { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  numero:                  { type: DataTypes.INTEGER, allowNull: false },
  activo_id:               { type: DataTypes.INTEGER, allowNull: false },
  consecuencia:            { type: DataTypes.TEXT, allowNull: false },
  probabilidad_inherente:  { type: DataTypes.SMALLINT, allowNull: false },
  impacto_inherente:       { type: DataTypes.SMALLINT, allowNull: false },
  nivel_riesgo_inherente:  {
    type: DataTypes.VIRTUAL,
    get() {
      const v = this.probabilidad_inherente * this.impacto_inherente;
      if (v <= 4)  return 'Bajo';
      if (v <= 9)  return 'Moderado';
      if (v <= 16) return 'Alto';
      return 'Extremo';
    },
  },
  tratamiento:  { type: DataTypes.STRING(50), defaultValue: 'Reducir' },
  en_matriz:    { type: DataTypes.BOOLEAN, defaultValue: false },
  activo:       { type: DataTypes.BOOLEAN, defaultValue: true },
  usuario_id:   { type: DataTypes.INTEGER },
}, {
  tableName:  'riesgos',
  timestamps: true,
  createdAt:  'created_at',
  updatedAt:  'updated_at',
});

module.exports = Riesgo;
