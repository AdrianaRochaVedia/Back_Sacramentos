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
  rol: {
    type: DataTypes.STRING(100),
    allowNull: false
  }
}, {
  tableName: 'usuario',
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
