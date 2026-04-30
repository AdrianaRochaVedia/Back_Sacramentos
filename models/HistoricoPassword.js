// models/HistoricoPassword.js
const { DataTypes } = require('sequelize');
const { sequelize } = require('../database/config');
const Usuario = require('./Usuario');

const HistoricoPassword = sequelize.define('HistoricoPassword', {
  id_historial: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    allowNull: false
  },
  id_usuario: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: Usuario,
      key: 'id_usuario'
    },
    onDelete: 'CASCADE'
  },
  password_hash: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  fecha_cambio: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'historico_password',
  timestamps: false
});

HistoricoPassword.belongsTo(Usuario, {
  foreignKey: 'id_usuario',
  as: 'usuario'
});

Usuario.hasMany(HistoricoPassword, {
  foreignKey: 'id_usuario',
  as: 'historico_passwords'
});

module.exports = HistoricoPassword;