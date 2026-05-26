// models/Modulo.js
const { DataTypes } = require('sequelize');
const { sequelize } = require('../database/config');

const Modulo = sequelize.define('Modulo', {
  id_modulo: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    allowNull: false
  },
  nombre: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: true
  },
  descripcion: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  ruta: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  icono: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  activo: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true
  },
  fecha_registro: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'modulo',
  timestamps: false
});

module.exports = Modulo;
