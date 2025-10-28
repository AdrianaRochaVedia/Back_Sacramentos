const express = require('express');
const router = express.Router();
const comentarioController = require('../controllers/comentarios');

router.post('/', comentarioController.crearComentario);
/**
 * @swagger
 * /api/comentarios:
 *   post:
 *     summary: Crear un nuevo comentario
 *     description: Crea un nuevo comentario asociado a un documento.
 *     tags:
 *       - Comentarios
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               comentario:
 *                 type: string
 *                 description: Contenido del comentario
 *                 example: Este documento necesita más detalles
 *               DOCUMENTO_id_documento:
 *                 type: integer
 *                 description: ID del documento asociado
 *                 example: 1
 *             required:
 *               - comentario
 *               - DOCUMENTO_id_documento
 *     responses:
 *       '201':
 *         description: Comentario creado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Comentario creado exitosamente
 *                 data:
 *                   $ref: '#/components/schemas/Comentario'
 *       '404':
 *         description: Documento no encontrado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: Documento no encontrado
 *       '500':
 *         description: Error al crear el comentario
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: Error al crear comentario
 *                 error:
 *                   type: string
 *                   example: Mensaje de error específico
 */

router.get('/', comentarioController.getAll);
/**
 * @swagger
 * /api/comentarios:
 *   get:
 *     summary: Obtener todos los comentarios
 *     description: Devuelve una lista de todos los comentarios, incluidos los eliminados.
 *     tags:
 *       - Comentarios
 *     responses:
 *       '200':
 *         description: Lista de comentarios
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Comentario'
 *       '500':
 *         description: Error al obtener los comentarios
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: Error al obtener comentarios
 *                 error:
 *                   type: string
 *                   example: Mensaje de error específico
 */

router.get('/:id_documento/comentarios', comentarioController.obtenerComentariosPorDocumento);
/**
 * @swagger
 * /api/comentarios/{id_documento}/comentarios:
 *   get:
 *     summary: Obtener comentarios de un documento
 *     description: Devuelve los comentarios activos y publicados de un documento específico, ordenados por fecha descendente.
 *     tags:
 *       - Comentarios
 *     parameters:
 *       - in: path
 *         name: id_documento
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID del documento
 *     responses:
 *       '200':
 *         description: Lista de comentarios
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Comentario'
 *       '500':
 *         description: Error al obtener los comentarios
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: Error al obtener comentarios
 *                 error:
 *                   type: string
 *                   example: Mensaje de error específico
 */

// Eliminar comentario (lógico)
router.delete('/:id_comentario', comentarioController.eliminarComentarioLogico);

/**
 * @swagger
 * /api/comentarios/{id_comentario}:
 *   delete:
 *     summary: Eliminar un comentario lógicamente
 *     description: Marca un comentario como eliminado lógicamente y despublicado.
 *     tags:
 *       - Comentarios
 *     parameters:
 *       - in: path
 *         name: id_comentario
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID del comentario
 *     responses:
 *       '200':
 *         description: Comentario eliminado lógicamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Comentario eliminado lógicamente
 *                 data:
 *                   $ref: '#/components/schemas/Comentario'
 *       '400':
 *         description: Comentario ya eliminado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: El comentario ya fue eliminado previamente
 *       '404':
 *         description: Comentario no encontrado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: Comentario no encontrado
 *       '500':
 *         description: Error al eliminar el comentario
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: Error al eliminar comentario
 *                 error:
 *                   type: string
 *                   example: Mensaje de error específico
 */

router.patch('/:id_comentario/toggle-publicado', comentarioController.togglePublicado);
/**
 * @swagger
 * /api/comentarios/{id_comentario}/toggle-publicado:
 *   patch:
 *     summary: Alternar estado publicado de un comentario
 *     description: Cambia el estado de publicación de un comentario.
 *     tags:
 *       - Comentarios
 *     parameters:
 *       - in: path
 *         name: id_comentario
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID del comentario
 *     responses:
 *       '200':
 *         description: Estado publicado actualizado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Estado publicado actualizado
 *                 data:
 *                   type: object
 *                   properties:
 *                     id_comentario:
 *                       type: integer
 *                       example: 1
 *                     publicado:
 *                       type: boolean
 *                       example: true
 *       '404':
 *         description: Comentario no encontrado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: Comentario no encontrado
 *       '500':
 *         description: Error al cambiar el estado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: Error al cambiar estado publicado
 *                 error:
 *                   type: string
 *                   example: Mensaje de error específico
 */

router.patch('/:id_comentario/toggle-eliminado', comentarioController.toggleEliminado);
/**
 * @swagger
 * /api/comentarios/{id_comentario}/toggle-eliminado:
 *   patch:
 *     summary: Alternar estado eliminado de un comentario
 *     description: Cambia el estado de eliminación lógica de un comentario.
 *     tags:
 *       - Comentarios
 *     parameters:
 *       - in: path
 *         name: id_comentario
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID del comentario
 *     responses:
 *       '200':
 *         description: Estado eliminado actualizado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Estado eliminado actualizado
 *                 data:
 *                   type: object
 *                   properties:
 *                     id_comentario:
 *                       type: integer
 *                       example: 1
 *                     isDeleted:
 *                       type: boolean
 *                       example: true
 *       '404':
 *         description: Comentario no encontrado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: Comentario no encontrado
 *       '500':
 *         description: Error al cambiar el estado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: Error al cambiar estado eliminado
 *                 error:
 *                   type: string
 *                   example: Mensaje de error específico
 */

module.exports = router;