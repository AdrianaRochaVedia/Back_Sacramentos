const { DataTypes } = require('sequelize');
const { sequelize } = require('../database/config');


const Propuesta = sequelize.define('Propuesta', {
  id_propuesta: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  propuesta: DataTypes.TEXT,
  fecha: DataTypes.DATE,
  isDeleted: DataTypes.BOOLEAN,
  publicado: DataTypes.BOOLEAN
}, {
  tableName: 'propuesta_ciudadana',
  timestamps: false
});

module.exports = Propuesta;

/**
 * @swagger
 * components:
 *   schemas:
 *     Propuesta:
 *       type: object
 *       properties:
 *         id_propuesta:
 *           type: integer
 *           description: ID único de la propuesta
 *           example: 1
 *         propuesta:
 *           type: string
 *           description: Contenido de la propuesta
 *           example: "Propuesta para mejorar la gestión documental."
 *         fecha:
 *           type: string
 *           format: date-time
 *           description: Fecha de creación de la propuesta
 *           example: "2025-06-18T02:03:00Z"
 *         isDeleted:
 *           type: boolean
 *           description: Indica si la propuesta está eliminada lógicamente
 *           example: false
 *         publicado:
 *           type: boolean
 *           description: Indica si la propuesta está publicada
 *           example: true
 *       required:
 *         - id_propuesta
 *       description: Representa una propuesta ciudadana
 */
