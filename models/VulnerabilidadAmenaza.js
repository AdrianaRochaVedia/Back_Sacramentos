const { DataTypes } = require('sequelize');
const { sequelize } = require('../database/config');

const VulnerabilidadAmenaza = sequelize.define('VulnerabilidadAmenaza', {
  id_vulnerabilidad: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  nombre:            { type: DataTypes.STRING(200), allowNull: false },
  descripcion:       { type: DataTypes.TEXT },
  tipo:              {
    type:         DataTypes.STRING(50),
    allowNull:    false,
    validate:     { isIn: [[
      'amenaza_natural',
      'amenaza_humana',
      'vulnerabilidad_personas',
      'vulnerabilidad_proceso',
      'vulnerabilidad_tecnologia',
      'vulnerabilidad_infraestructura',
    ]] },
  },
  activo:            { type: DataTypes.BOOLEAN, defaultValue: true },
  usuario_id:        { type: DataTypes.INTEGER },
}, {
  tableName:  'vulnerabilidades_amenazas',
  timestamps: true,
  createdAt:  'created_at',
  updatedAt:  'updated_at',
});

module.exports = VulnerabilidadAmenaza;
