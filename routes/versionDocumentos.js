/*
    Rutas de versionesDocumentos / Documentos
    host + /api/versionesDocumentos
*/

const { Router } = require('express');
const { check } = require('express-validator');
const { validarCampos } = require('../middlewares/validar-campos');
const { validarJWT } = require('../middlewares/validar-jwt');
const { 
    getVersionesDocumento,
    getVersionDocumento,
    restaurarVersion
} = require('../controllers/versionDocumento');

const router = Router();

// Proteger todas las rutas con JWT
router.use(validarJWT);

// Obtener todas las versiones de un documento
router.get('/documento/:id', [
    check('id', 'El ID del documento debe ser un número válido').isNumeric().toInt(),
    validarCampos
], getVersionesDocumento);

/**
 * @swagger
 * /api/versiones/documento/{id}:
 *   get:
 *     summary: Obtener todas las versiones de un documento
 *     description: Devuelve todas las versiones de un documento específico, ordenadas por número de versión descendente.
 *     tags:
 *       - Versiones de Documentos
 *     security:
 *       - xToken: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID del documento
 *     responses:
 *       '200':
 *         description: Lista de versiones
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 ok:
 *                   type: boolean
 *                   example: true
 *                 versiones:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/VersionDocumento'
 *       '500':
 *         description: Error al obtener las versiones
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 ok:
 *                   type: boolean
 *                   example: false
 *                 msg:
 *                   type: string
 *                   example: Error al obtener las versiones
 */

// Obtener una versión específica
router.get('/documento/:id/version/:versionId', [
    check('id', 'El ID del documento debe ser un número válido').isNumeric().toInt(),
    check('versionId', 'El ID de la versión debe ser un número válido').isNumeric().toInt(),
    validarCampos
], getVersionDocumento);

/**
 * @swagger
 * /api/versiones/documento/{id}/version/{versionId}:
 *   get:
 *     summary: Obtener una versión específica
 *     description: Devuelve los detalles de una versión específica de un documento.
 *     tags:
 *       - Versiones de Documentos
 *     security:
 *       - xToken: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID del documento
 *       - in: path
 *         name: versionId
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID de la versión
 *     responses:
 *       '200':
 *         description: Detalles de la versión
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 ok:
 *                   type: boolean
 *                   example: true
 *                 version:
 *                   $ref: '#/components/schemas/VersionDocumento'
 *       '404':
 *         description: Versión no encontrada
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 ok:
 *                   type: boolean
 *                   example: false
 *                 msg:
 *                   type: string
 *                   example: Versión no encontrada
 *       '500':
 *         description: Error al obtener la versión
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 ok:
 *                   type: boolean
 *                   example: false
 *                 msg:
 *                   type: string
 *                   example: Error al obtener la versión
 */

// Restaurar una versión específica
router.post('/documento/:id/version/:versionId/restaurar', [
    check('id', 'El ID del documento debe ser un número válido').isNumeric().toInt(),
    check('versionId', 'El ID de la versión debe ser un número válido').isNumeric().toInt(),
    validarCampos
], restaurarVersion);

/**
 * @swagger
 * /api/versiones/documento/{id}/version/{versionId}/restaurar:
 *   post:
 *     summary: Restaurar una versión específica
 *     description: Restaura una versión específica de un documento, actualizando el documento y creando una nueva versión con el estado anterior.
 *     tags:
 *       - Versiones de Documentos
 *     security:
 *       - xToken: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID del documento
 *       - in: path
 *         name: versionId
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID de la versión
 *     responses:
 *       '200':
 *         description: Versión restaurada exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 ok:
 *                   type: boolean
 *                   example: true
 *                 documento:
 *                   $ref: '#/components/schemas/Documento'
 *       '404':
 *         description: Versión o documento no encontrado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 ok:
 *                   type: boolean
 *                   example: false
 *                 msg:
 *                   type: string
 *                   example: Versión no encontrada
 *       '500':
 *         description: Error al restaurar la versión
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 ok:
 *                   type: boolean
 *                   example: false
 *                 msg:
 *                   type: string
 *                   example: Error al restaurar la versión
 */

module.exports = router;
