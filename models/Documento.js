// models/Documento.js
const { DataTypes } = require('sequelize');
const { sequelize } = require('../database/config');
const Usuario = require('./Usuario');
const aplicarMiddlewarePalabrasClave = require('../middlewares/ProcesarPalabrasClave');

const Documento = sequelize.define('Documento', {
  id_documento: {
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
  fuente_origen: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  descripcion: DataTypes.TEXT,
  importancia: DataTypes.TEXT,
  anio_publicacion: DataTypes.DATE,
  enlace: DataTypes.STRING(2083),
  concepto_basico: DataTypes.TEXT,
  USUARIO_id_usuario: {
  type: DataTypes.INTEGER,
  allowNull: false,
  references: {
    model: Usuario,
    key: 'id_usuario'
  }
},
  aplicacion: DataTypes.STRING(255),
  cpe: DataTypes.TEXT,
  jerarquia: DataTypes.STRING(255),
  isDeleted: DataTypes.BOOLEAN,
  vistas: DataTypes.INTEGER,
  palabras_clave_procesadas: DataTypes.TEXT
}, {
  tableName: 'DOCUMENTO',
  timestamps: false
});

Documento.belongsTo(Usuario, {
    foreignKey: 'USUARIO_id_usuario'
  });
  Usuario.hasMany(Documento, {
    foreignKey: 'USUARIO_id_usuario'
  });

// middleware
aplicarMiddlewarePalabrasClave(Documento);

module.exports = Documento;

/**
 * @swagger
 * components:
 *   schemas:
 *     Documento:
 *       type: object
 *       properties:
 *         id_documento:
 *           type: integer
 *           description: ID único del documento
 *           example: 1
 *         nombre:
 *           type: string
 *           description: Nombre del documento
 *           example: "Informe Anual 2025"
 *         tipo:
 *           type: string
 *           description: Tipo de documento
 *           example: "Informe"
 *         fuente_origen:
 *           type: string
 *           description: Fuente de origen del documento
 *           example: "Gobierno"
 *         descripcion:
 *           type: string
 *           description: Descripción del documento
 *           example: "Informe sobre políticas públicas."
 *         importancia:
 *           type: string
 *           description: Nivel de importancia del documento
 *           example: "Alta"
 *         anio_publicacion:
 *           type: string
 *           format: date
 *           description: Año de publicación del documento
 *           example: "2025-01-01"
 *         enlace:
 *           type: string
 *           description: URL del documento
 *           example: "https://example.com/documento.pdf"
 *         concepto_basico:
 *           type: string
 *           description: Concepto básico del documento
 *           example: "Políticas públicas para 2025"
 *         USUARIO_id_usuario:
 *           type: integer
 *           description: ID del usuario que creó el documento
 *           example: 1
 *         aplicacion:
 *           type: string
 *           description: Aplicación del documento
 *           example: "Gestión pública"
 *         cpe:
 *           type: string
 *           description: Código de procedimiento específico
 *           example: "CPE-123"
 *         jerarquia:
 *           type: string
 *           description: Jerarquía del documento
 *           example: "Nacional"
 *         isDeleted:
 *           type: boolean
 *           description: Indica si el documento está eliminado lógicamente
 *           example: false
 *         vistas:
 *           type: integer
 *           description: Número de vistas del documento
 *           example: 100
 *         palabras_clave_procesadas:
 *           type: string
 *           description: Palabras clave procesadas del documento
 *           example: "política, gestión, pública"
 *       required:
 *         - id_documento
 *         - nombre
 *         - tipo
 *         - fuente_origen
 *         - USUARIO_id_usuario
 *         - descripcion
 *         - importancia
 *         - anio_publicacion
 *         - enlace
 *         - concepto_basico
 *         - aplicacion
 *         - cpe
 *         - jerarquia
 *       description: Representa un documento en el sistema
 */