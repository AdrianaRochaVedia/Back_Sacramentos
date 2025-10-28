// models/Usuario.js
const { DataTypes } = require('sequelize');
const { sequelize } = require('../database/config');

const Parroquia = sequelize.define('Parroquia', {
  id_parroquia: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    allowNull: false
  },
  nombre: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  direccion: {
    type: DataTypes.STRING(200),
    allowNull: false
  },
  telefono: {
    type: DataTypes.STRING(15),
    allowNull: false
  },
  email: {
    type: DataTypes.STRING(100),
    allowNull: false,   
    unique: true
    }

}, {
  tableName: 'institucion_parroquia',
  timestamps: false
});

module.exports = Parroquia;
