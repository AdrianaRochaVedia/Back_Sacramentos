// models/Usuario.js
const { DataTypes } = require('sequelize');
const { sequelize } = require('../database/config');
const Rol  = require('./Rol');

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
  
  id_rol: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'rol',
      key: 'id_rol'
    },
    onDelete: 'SET NULL'
  },
  //Revisar essto
  // rol: {
  //   type: DataTypes.STRING(100),
  //   allowNull: false
  // },

  intentos_fallidos: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0
  },
  bloqueado: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  },
  fecha_bloqueo: {
    type: DataTypes.DATE,
    allowNull: true
  },
  fecha_ultimo_cambio_password: {
    type: DataTypes.DATE,
    allowNull: true
  },
  fecha_expiracion_password: {
    type: DataTypes.DATE,
    allowNull: true
  }

}, {
  tableName: 'usuario',
  timestamps: false
});

Usuario.belongsTo(Rol, {
  foreignKey: 'id_rol',
  as: 'rol'
});

Rol.hasMany(Usuario, {
  foreignKey: 'id_rol',
  as: 'usuarios'
});

module.exports = Usuario;

