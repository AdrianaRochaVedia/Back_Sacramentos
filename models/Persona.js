// models/Usuario.js
const { DataTypes } = require('sequelize');
const { sequelize } = require('../database/config');

const Persona = sequelize.define('Persona', {
  id_persona: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    allowNull: false
  },
  nombre: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  apellido_paterno: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  apellido_materno: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  carnet_identidad: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: true
  },
  fecha_nacimiento: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  lugar_nacimiento: {
    type: DataTypes.STRING(150),
    allowNull: false
  },
  nombre_padre: {
    type: DataTypes.STRING(200),
    allowNull: false
  },
  nombre_madre: {
    type: DataTypes.STRING(200),
    allowNull: false
  },
  activo: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true
  },
  estado: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  sacerdote: {
    type: DataTypes.BOOLEAN,
    allowNull: true
  },

}, {
  tableName: 'persona',
  timestamps: false
});

module.exports = Persona;
