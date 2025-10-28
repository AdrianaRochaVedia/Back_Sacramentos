// models/Usuario.js
const { DataTypes } = require('sequelize');
const { sequelize } = require('../database/config');

const Usuario = sequelize.define('Usuario', {
  id_usuario: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    allowNull: false
  },
  nombre: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  tipo: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  correo: {
    type: DataTypes.STRING(255),
    allowNull: false,
    unique: true
  },
  contrasenia: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  isDeleted: {
    type: DataTypes.BOOLEAN,
    allowNull: false
  }
}, {
  tableName: 'USUARIO',
  timestamps: false
});

module.exports = Usuario;

/**
 * @swagger
 * components:
 *   schemas:
 *     Usuario:
 *       type: object
 *       properties:
 *         id_usuario:
 *           type: integer
 *           description: ID único del usuario
 *           example: 1
 *         nombre:
 *           type: string
 *           description: Nombre del usuario
 *           example: "Juan Pérez"
 *         tipo:
 *           type: string
 *           description: Tipo de usuario
 *           example: "Administrador"
 *         correo:
 *           type: string
 *           description: Correo electrónico del usuario
 *           example: "juan.perez@example.com"
 *         contrasenia:
 *           type: string
 *           description: Contraseña del usuario (almacenada de forma segura)
 *           example: "hashed_password"
 *         isDeleted:
 *           type: boolean
 *           description: Indica si el usuario está eliminado lógicamente
 *           example: false
 *       required:
 *         - id_usuario
 *         - nombre
 *         - tipo
 *         - correo
 *         - contrasenia
 *         - isDeleted
 *       description: Representa un usuario en el sistema
 */
