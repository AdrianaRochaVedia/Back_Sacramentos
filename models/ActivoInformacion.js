const { DataTypes } = require('sequelize');
const { sequelize } = require('../database/config');

const ActivoInformacion = sequelize.define('ActivoInformacion', {
  id_activo:   { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  nombre:      { type: DataTypes.STRING(200), allowNull: false },
  descripcion: { type: DataTypes.TEXT },
  tipo:        { type: DataTypes.STRING(50) }, // hardware, software, datos, personas, servicios...
  propietario: { type: DataTypes.STRING(100) },
  activo:      { type: DataTypes.BOOLEAN, defaultValue: true },
  usuario_id:  { type: DataTypes.INTEGER },
}, {
  tableName:  'activos_informacion',
  timestamps: true,
  createdAt:  'created_at',
  updatedAt:  'updated_at',
});

module.exports = ActivoInformacion;
