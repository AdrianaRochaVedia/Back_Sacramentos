// models/HistoricoPassword.js
const { DataTypes } = require('sequelize');
const { sequelize } = require('../database/config');
const Usuario = require('./Usuario');

const ConfiguracionSeguridad = sequelize.define('ConfiguracionSeguridad', {
  id_config: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    allowNull: false
  },
  longitud_minima:{
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 8
  },
  longitud_maxima:{
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 64
  },
  requiere_mayuscula:{
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true
  },
  requiere_minuscula:{
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true
  },
  requiere_numero:{
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true
  },
  requiere_caracter_especial:{
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true
  },
  max_intentos_fallidos:{
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 5
  },
  tiempo_bloqueo_minutos:{
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 15
  },
  historial_passwords:{
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 5
  },
  vida_util_password:{
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 90
  },
  permite_reutilizacion:{
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  },
  usa_2fa:{
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  },
  usa_captcha:{
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  },
  activo:{
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true
  },
  fecha_actualizacion:{
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },

}, {
  tableName: 'configuracion_seguridad',
  timestamps: false
});

module.exports = HistoricoPassword;