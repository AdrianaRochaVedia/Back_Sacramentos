// models/MatrimonioDetalle.js
const { DataTypes } = require('sequelize');
const { sequelize } = require('../database/config');
const Sacramento = require('./Sacramento');

const MatrimonioDetalle = sequelize.define('MatrimonioDetalle', {
  sacramento_id_sacramento: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    allowNull: false,
    references: {
      model: Sacramento,
      key: 'id_sacramento'
    }
  },
  reg_civil: {
    type: DataTypes.STRING(150),
    allowNull: true
  },
  lugar_ceremonia: {
    type: DataTypes.STRING(150),
    allowNull: true
  },
  numero_acta: {
    type: DataTypes.INTEGER,
    allowNull: true
  }
}, {
  tableName: 'matrimonio_detalle',
  timestamps: false
});

MatrimonioDetalle.belongsTo(Sacramento, {
  foreignKey: 'sacramento_id_sacramento',
  as: 'sacramento'
});

Sacramento.hasOne(MatrimonioDetalle, {
  foreignKey: 'sacramento_id_sacramento',
  as: 'matrimonioDetalle'
});

module.exports = MatrimonioDetalle;