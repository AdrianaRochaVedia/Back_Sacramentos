// models/PersonaSacramento.js
const { DataTypes } = require('sequelize');
const { sequelize } = require('../database/config');
const Rol = require('./Rol');
const Permiso = require('./Permisos');

const RolPermiso = sequelize.define('RolPermiso', {
  id_rol: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    allowNull: false,
    references: {
      model: Rol,
      key: 'id_rol'
    },
    onDelete: 'CASCADE'
  },
  id_permiso: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    allowNull: false,
    references: {
      model: Permiso,
      key: 'id_permiso'
    },
    onDelete: 'CASCADE'
  },
  fecha_registro: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'rol_permiso',
  timestamps: false
});

Rol.belongsToMany(Permiso, {
  through: RolPermiso,
  foreignKey: 'id_rol',
  otherKey: 'id_permiso',
  as: 'permisos'
});

Permiso.belongsToMany(Rol, {
  through: RolPermiso,
  foreignKey: 'id_permiso',
  otherKey: 'id_rol',
  as: 'roles'
});

Rol.hasMany(RolPermiso, {
  foreignKey: 'id_rol',
  as: 'rolPermisos'
});

RolPermiso.belongsTo(Rol, {
  foreignKey: 'id_rol',
  as: 'rol'
});

Permiso.hasMany(RolPermiso, {
  foreignKey: 'id_permiso',
  as: 'rolPermisos'
});

RolPermiso.belongsTo(Permiso, {
  foreignKey: 'id_permiso',
  as: 'permiso'
});


module.exports = RolPermiso;