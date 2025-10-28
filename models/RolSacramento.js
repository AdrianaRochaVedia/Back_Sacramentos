// models/Usuario.js
const { DataTypes } = require('sequelize');
const { sequelize } = require('../database/config');

const RolSacramento = sequelize.define('RolSacramento', {
  id_rol_sacra: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    allowNull: false
  },
  nombre: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
}, {
  tableName: 'rol_sacramento',
  timestamps: false
});

module.exports = RolSacramento;
