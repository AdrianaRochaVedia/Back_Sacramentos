// models/Usuario.js
const { DataTypes } = require('sequelize');
const { sequelize } = require('../database/config');

const Usuario = sequelize.define('Usuario', {
  id_usuario: {
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
  email: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: true
  },
  password: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  fecha_nacimiento: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  activo: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true
  },
  rol: {
    type: DataTypes.STRING(100),
    allowNull: false
  }
}, {
  tableName: 'usuario',
  timestamps: false
});

module.exports = Usuario;

