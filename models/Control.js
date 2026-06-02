const { DataTypes } = require('sequelize');
const { sequelize } = require('../database/config');

const Control = sequelize.define('Control', {
  id_control:           { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  riesgo_id:            { type: DataTypes.INTEGER, allowNull: false },
  descripcion:          { type: DataTypes.TEXT, allowNull: false },
  tipo_control:         { type: DataTypes.STRING(20) },     // preventivo, detective, correctivo
  nivel_efectividad:    {
    type:     DataTypes.STRING(20),
    allowNull: false,
    validate: { isIn: [['Manual', 'Automático', 'Semi automático']] },
  },
  frecuencia_control:   { type: DataTypes.STRING(20) },
  probabilidad_residual: { type: DataTypes.SMALLINT, allowNull: false },
  impacto_residual:      { type: DataTypes.SMALLINT, allowNull: false },
  nivel_riesgo_residual: {
    type: DataTypes.VIRTUAL,
    get() {
      const v = this.probabilidad_residual * this.impacto_residual;
      if (v <= 4)  return 'Bajo';
      if (v <= 9)  return 'Moderado';
      if (v <= 16) return 'Alto';
      return 'Extremo';
    },
  },
  activo:      { type: DataTypes.BOOLEAN, defaultValue: true },
  usuario_id:  { type: DataTypes.INTEGER },
}, {
  tableName:  'controles',
  timestamps: true,
  createdAt:  'created_at',
  updatedAt:  'updated_at',
});

module.exports = Control;
