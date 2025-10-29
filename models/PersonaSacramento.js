// models/PersonaSacramento.js
const { DataTypes } = require('sequelize');
const { sequelize } = require('../database/config');
const Persona = require('./Persona');
const Sacramento = require('./Sacramento');
const RolSacramento = require('./RolSacramento');

const PersonaSacramento = sequelize.define('PersonaSacramento', {
  persona_id_persona: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    allowNull: false,
    references: {
      model: Persona,
      key: 'id_persona'
    }
  },
  rol_sacramento_id_rol_sacra: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    allowNull: false,
    references: {
      model: RolSacramento,
      key: 'id_rol_sacra'
    }
  },
  sacramento_id_sacramento: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    allowNull: false,
    references: {
      model: Sacramento,
      key: 'id_sacramento'
    }
  }
}, {
  tableName: 'persona_sacramento',
  timestamps: false
});

// Relaciones
PersonaSacramento.belongsTo(Persona, {
  foreignKey: 'persona_id_persona',
  as: 'persona'
});

Persona.hasMany(PersonaSacramento, {
  foreignKey: 'persona_id_persona',
  as: 'personaSacramentos'
});

PersonaSacramento.belongsTo(Sacramento, {
  foreignKey: 'sacramento_id_sacramento',
  as: 'sacramento'
});

Sacramento.hasMany(PersonaSacramento, {
  foreignKey: 'sacramento_id_sacramento',
  as: 'personaSacramentos'
});

PersonaSacramento.belongsTo(RolSacramento, {
  foreignKey: 'rol_sacramento_id_rol_sacra',
  as: 'rolSacramento'
});

RolSacramento.hasMany(PersonaSacramento, {
  foreignKey: 'rol_sacramento_id_rol_sacra',
  as: 'personaSacramentos'
});

module.exports = PersonaSacramento;