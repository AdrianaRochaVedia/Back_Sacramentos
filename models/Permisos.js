// models/Permisos.js
const { DataTypes } = require('sequelize');
const { sequelize } = require('../database/config');

const Permiso = sequelize.define('Permiso', {
  id_permiso: {
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
    allowNull: false
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
  },
  
}, {
  tableName: 'permiso',
  timestamps: false
});

module.exports = Permiso;

