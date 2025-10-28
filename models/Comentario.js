const { DataTypes } = require('sequelize');
const { sequelize } = require('../database/config');
const Documento = require('./Documento');

const Comentario = sequelize.define('Comentario', {
  id_comentario: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  comentario: DataTypes.TEXT,
  DOCUMENTO_id_documento: DataTypes.INTEGER,
  fecha: DataTypes.DATE,
  isDeleted: DataTypes.BOOLEAN,
  publicado: DataTypes.BOOLEAN
}, {
  tableName: 'COMENTARIOS',
  timestamps: false
});

// Para la relacion
Comentario.belongsTo(Documento, {
  foreignKey: 'DOCUMENTO_id_documento'
});
Documento.hasMany(Comentario, {
  foreignKey: 'DOCUMENTO_id_documento'
});

module.exports = Comentario;

/**
 * @swagger
 * components:
 *   schemas:
 *     Comentario:
 *       type: object
 *       properties:
 *         id_comentario:
 *           type: integer
 *           description: ID único del comentario
 *           example: 1
 *         comentario:
 *           type: string
 *           description: Contenido del comentario
 *           example: "Este documento necesita más detalles."
 *         DOCUMENTO_id_documento:
 *           type: integer
 *           description: ID del documento asociado
 *           example: 1
 *         fecha:
 *           type: string
 *           format: date-time
 *           description: Fecha de creación del comentario
 *           example: "2025-06-18T02:03:00Z"
 *         isDeleted:
 *           type: boolean
 *           description: Indica si el comentario está eliminado lógicamente
 *           example: false
 *         publicado:
 *           type: boolean
 *           description: Indica si el comentario está publicado
 *           example: true
 *       required:
 *         - id_comentario
 *         - DOCUMENTO_id_documento
 *       description: Representa un comentario asociado a un documento
 */
