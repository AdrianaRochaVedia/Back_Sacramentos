// models/Usuario.js
const { DataTypes } = require('sequelize');
const { sequelize } = require('../database/config');
const persona = require('./Persona');

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
    },
    id_persona: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: persona,
      key: 'id_persona'
    }
  }

}, {
  tableName: 'institucion_parroquia',
  timestamps: false
});

module.exports = Parroquia;
