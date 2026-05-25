const { DataTypes } = require('sequelize');
const { sequelize } = require('../database/config');

const DominioPermitido = sequelize.define('DominioPermitido', {
  id_dominio: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  dominio: {
    type: DataTypes.STRING(150),
    allowNull: false,
    unique: true,
  },
  descripcion: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  activo: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true,
  },
  fecha_registro: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  },
}, {
  tableName: 'dominio_permitido',
  timestamps: false,
});

module.exports = DominioPermitido;