// models/Documento.js
const { DataTypes } = require('sequelize');
const { sequelize } = require('../database/config');
const Usuario = require('./Usuario');
const Parroquia = require('./Parroquia');
const TipoSacramento = require('./TipoSacramento');

//const aplicarMiddlewarePalabrasClave = require('../middlewares/ProcesarPalabrasClave');

const Sacramento = sequelize.define('Sacramento', {
  id_sacramento: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    allowNull: false
  },
  fecha_sacramento: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  fecha_registro: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  fecha_actualizacion: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  activo: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true
  },
  foja: {
    type: DataTypes.STRING(10),
    allowNull: false
  },
  numero: {
    type: DataTypes.INTEGER,
    allowNull: false
  },

  usuario_id_usuario: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: Usuario,
      key: 'id_usuario'
    }
  },

  institucion_parroquia_id_parroquia: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: Parroquia,
      key: 'id_parroquia'
    }
  },

  tipo_sacramento_id_tipo: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: TipoSacramento,
      key: 'id_tipo'
    }
  },
  
  //palabras_clave_procesadas: DataTypes.TEXT
}, {
  tableName: 'sacramento',
  timestamps: false
});

Sacramento.belongsTo(Usuario, {
    foreignKey: 'usuario_id_usuario',
    as: 'usuario'
  });
  Usuario.hasMany(Sacramento, {
    foreignKey: 'usuario_id_usuario',
    as: 'sacramentos'
  });

  Sacramento.belongsTo(Parroquia, {
    foreignKey: 'institucion_parroquia_id_parroquia',
    as: 'parroquia'
  });

  Parroquia.hasMany(Sacramento, {
    foreignKey: 'institucion_parroquia_id_parroquia',
    as: 'sacramentos'
  });

  Sacramento.belongsTo(TipoSacramento, {
    foreignKey: 'tipo_sacramento_id_tipo',
    as: 'tipoSacramento'
  });

  TipoSacramento.hasMany(Sacramento, {
    foreignKey: 'tipo_sacramento_id_tipo',
    as: 'sacramentos'
  });

// middleware
//aplicarMiddlewarePalabrasClave(Sacramento);

module.exports = Sacramento;
