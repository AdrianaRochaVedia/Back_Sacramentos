const { DataTypes } = require('sequelize');
const { sequelize } = require('../database/config');
const Documento = require('./Documento');

const VersionDocumento = sequelize.define('VersionDocumento', {
  id_version: {
    type: DataTypes.BIGINT.UNSIGNED,
    primaryKey: true,
    autoIncrement: true
  },
  nombre: DataTypes.STRING(255),
  tipo: DataTypes.STRING(255),
  fuente_origen: DataTypes.STRING(255),
  descripcion: DataTypes.TEXT,
  importancia: DataTypes.TEXT,
  anio_publicacion: DataTypes.DATE,
  enlace: DataTypes.STRING(2083),
  concepto_basico: DataTypes.TEXT,
  aplicacion: DataTypes.STRING(255),
  cpe: DataTypes.TEXT,
  jerarquia: DataTypes.STRING(255),
  isVersion: DataTypes.BOOLEAN,
  vistas: DataTypes.INTEGER,
  DOCUMENTO_id_documento: {
    type: DataTypes.BIGINT.UNSIGNED,
    allowNull: false
  },
  fecha_version: DataTypes.DATE,
  numero_version: DataTypes.INTEGER,
  palabras_clave_procesadas: DataTypes.TEXT
}, {
  tableName: 'VERSION_DOCUMENTO',
  timestamps: false
});

// RELACIÓN con DOCUMENTO
VersionDocumento.belongsTo(Documento, {
  foreignKey: 'DOCUMENTO_id_documento'
});
Documento.hasMany(VersionDocumento, {
  foreignKey: 'DOCUMENTO_id_documento'
});

module.exports = VersionDocumento;

/**
 * @swagger
 * components:
 *   schemas:
 *     VersionDocumento:
 *       type: object
 *       properties:
 *         id_version:
 *           type: integer
 *           description: ID único de la versión del documento
 *           example: 1
 *         nombre:
 *           type: string
 *           description: Nombre de la versión del documento
 *           example: "Versión 2 - Informe Anual"
 *         tipo:
 *           type: string
 *           description: Tipo de la versión del documento
 *           example: "Informe"
 *         fuente_origen:
 *           type: string
 *           description: Fuente de origen de la versión
 *           example: "Gobierno"
 *         descripcion:
 *           type: string
 *           description: Descripción de la versión
 *           example: "Versión actualizada del informe."
 *         importancia:
 *           type: string
 *           description: Nivel de importancia de la versión
 *           example: "Alta"
 *         anio_publicacion:
 *           type: string
 *           format: date
 *           description: Año de publicación de la versión
 *           example: "2025-01-01"
 *         enlace:
 *           type: string
 *           description: URL de la versión del documento
 *           example: "https://example.com/version2.pdf"
 *         concepto_basico:
 *           type: string
 *           description: Concepto básico de la versión
 *           example: "Actualización de políticas"
 *         aplicacion:
 *           type: string
 *           description: Aplicación de la versión
 *           example: "Gestión pública"
 *         cpe:
 *           type: string
 *           description: Código de procedimiento específico
 *           example: "CPE-124"
 *         jerarquia:
 *           type: string
 *           description: Jerarquía de la versión
 *           example: "Nacional"
 *         isVersion:
 *           type: boolean
 *           description: Indica si es una versión del documento
 *           example: true
 *         vistas:
 *           type: integer
 *           description: Número de vistas de la versión
 *           example: 50
 *         DOCUMENTO_id_documento:
 *           type: integer
 *           description: ID del documento asociado
 *           example: 1
 *         fecha_version:
 *           type: string
 *           format: date-time
 *           description: Fecha de creación de la versión
 *           example: "2025-06-18T02:03:00Z"
 *         numero_version:
 *           type: integer
 *           description: Número de la versión
 *           example: 2
 *         palabras_clave_procesadas:
 *           type: string
 *           description: Palabras clave procesadas de la versión
 *           example: "política, gestión, actualización"
 *       required:
 *         - id_version
 *         - DOCUMENTO_id_documento
 *       description: Representa una versión de un documento en el sistema
 */