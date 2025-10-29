// models/PasswordReset.js
const { DataTypes } = require('sequelize');

const { sequelize } = require('../database/config');

const PasswordReset =
  sequelize.models.PasswordReset ||
  sequelize.define(
    'PasswordReset',
    {
      id_reset: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
      id_usuario: { type: DataTypes.INTEGER, allowNull: false },
      token_hash: { type: DataTypes.STRING(64), allowNull: false },   // sha256 hex
      expires_at: { type: DataTypes.DATE, allowNull: false },
      used_at: { type: DataTypes.DATE, allowNull: true },
      purpose: { type: DataTypes.ENUM('setup', 'reset'), allowNull: false, defaultValue: 'reset' }
    },
    {
      tableName: 'password_resets',
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      underscored: true
    }
  );

module.exports = PasswordReset;