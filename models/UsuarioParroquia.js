const { DataTypes } = require('sequelize');
const { sequelize } = require('../database/config');
const Usuario = require('./Usuario');
const Parroquia = require('./Parroquia');

const UsuarioParroquia = sequelize.define('UsuarioParroquia', {
  id_usuario_parroquia: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  id_usuario: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  id_parroquia: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  rol_en_parroquia: {
    type: DataTypes.STRING(50),
    allowNull: false,
  },
  activo: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true,
  },
  fecha_asignacion: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  },
  fecha_fin: {
    type: DataTypes.DATE,
    allowNull: true,
  },
}, {
  tableName: 'usuario_parroquia',
  timestamps: false,
});

UsuarioParroquia.associate = (models) => {
  UsuarioParroquia.belongsTo(models.Usuario, {
    foreignKey: 'id_usuario',
    as: 'usuario',
  });

  UsuarioParroquia.belongsTo(models.Parroquia, {
    foreignKey: 'id_parroquia',
    as: 'parroquia',
  });
};

module.exports = UsuarioParroquia;