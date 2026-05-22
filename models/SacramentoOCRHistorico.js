const { DataTypes } = require('sequelize');
const { sequelize } = require('../database/config');
const TipoSacramento = require('./TipoSacramento');
const Parroquia = require('./Parroquia');

const SacramentoOcrHistorico = sequelize.define('SacramentoOcrHistorico', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    allowNull: false
  },
  datos_extraidos: {
    type: DataTypes.JSONB,
    allowNull: false
  },
  s3_key: {
    type: DataTypes.STRING(500),
    allowNull: false
  },
  estado: {
    type: DataTypes.STRING(20),
    allowNull: false,
    defaultValue: 'pendiente',
    validate: {
      isIn: [['pendiente', 'confirmado', 'rechazado']]
    }
  },
  usuario_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: 'usuario', key: 'id_usuario' }
  },
  institucion_parroquia_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: 'institucion_parroquia', key: 'id_parroquia' }
  },
  tipo_sacramento_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: 'tipo_sacramento', key: 'id_tipo' }
  },
  sacramento_id: {
    type: DataTypes.INTEGER,
    allowNull: true,   
    references: { model: 'sacramento', key: 'id_sacramento' }
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
  }
}, {
  tableName: 'sacramento_ocr_historico',
  timestamps: false  
});

SacramentoOcrHistorico.belongsTo(TipoSacramento, {
  foreignKey: 'tipo_sacramento_id',
  as: 'tipoSacramento'
});

SacramentoOcrHistorico.belongsTo(Parroquia, {
  foreignKey: 'institucion_parroquia_id',
  as: 'parroquia'
});
module.exports = SacramentoOcrHistorico;