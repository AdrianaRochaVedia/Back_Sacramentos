const express = require('express');
const router = express.Router();
const propuestaController = require('../controllers/propuesta');

router.post('/', propuestaController.crearPropuesta);
// Crear propuesta
/**
 * @swagger
 * /api/propuestas:
 *   post:
 *     summary: Crear una nueva propuesta
 *     description: Crea una nueva propuesta ciudadana.
 *     tags:
 *       - Propuestas
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               propuesta:
 *                 type: string
 *                 description: Contenido de la propuesta
 *                 example: Propuesta para mejorar la gestión documental
 *             required:
 *               - propuesta
 *     responses:
 *       '201':
 *         description: Propuesta creada exitosamente
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
 *                   example: Propuesta creada exitosamente
 *                 data:
 *                   $ref: '#/components/schemas/Propuesta'
 *       '500':
 *         description: Error al crear la propuesta
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
 *                   example: Error al crear propuesta
 *                 error:
 *                   type: string
 *                   example: Mensaje de error específico
 */

// Obtener propuestas de un documento (opcional)
router.get('/', propuestaController.getAll);

/**
 * @swagger
 * /api/propuestas:
 *   get:
 *     summary: Obtener todas las propuestas
 *     description: Devuelve una lista de todas las propuestas, incluidas las eliminadas.
 *     tags:
 *       - Propuestas
 *     responses:
 *       '200':
 *         description: Lista de propuestas
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
 *                     $ref: '#/components/schemas/Propuesta'
 *       '500':
 *         description: Error al obtener las propuestas
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
 *                   example: Error al obtener propuestas
 *                 error:
 *                   type: string
 *                   example: Mensaje de error específico
 */

router.delete('/:id_propuesta', propuestaController.eliminarComentarioLogico);

// Eliminar propuesta (lógico)
/**
 * @swagger
 * /api/propuestas/{id_propuesta}:
 *   delete:
 *     summary: Eliminar una propuesta lógicamente
 *     description: Marca una propuesta como eliminada lógicamente y despublicada.
 *     tags:
 *       - Propuestas
 *     parameters:
 *       - in: path
 *         name: id_propuesta
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID de la propuesta
 *     responses:
 *       '200':
 *         description: Propuesta eliminada lógicamente
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
 *                   example: Propuesta eliminada lógicamente
 *                 data:
 *                   $ref: '#/components/schemas/Propuesta'
 *       '400':
 *         description: Propuesta ya eliminada
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
 *         description: Propuesta no encontrada
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
 *                   example: Propuesta no encontrada
 *       '500':
 *         description: Error al eliminar la propuesta
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

router.patch('/:id_propuesta/toggle-publicado', propuestaController.togglePublicado);
// Alternar estado publicado de una propuesta
/**
 * @swagger
 * /api/propuestas/{id_propuesta}/toggle-publicado:
 *   patch:
 *     summary: Alternar estado publicado de una propuesta
 *     description: Cambia el estado de publicación de una propuesta.
 *     tags:
 *       - Propuestas
 *     parameters:
 *       - in: path
 *         name: id_propuesta
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID de la propuesta
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
 *                     id_propuesta:
 *                       type: integer
 *                       example: 1
 *                     publicado:
 *                       type: boolean
 *                       example: true
 *       '404':
 *         description: Propuesta no encontrada
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
 *                   example: Propuesta no encontrada
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

router.patch('/:id_propuesta/toggle-eliminado', propuestaController.toggleEliminado);
// Alternar estado eliminado de una propuesta
/**
 * @swagger
 * /api/propuestas/{id_propuesta}/toggle-eliminado:
 *   patch:
 *     summary: Alternar estado eliminado de una propuesta
 *     description: Cambia el estado de eliminación lógica de una propuesta.
 *     tags:
 *       - Propuestas
 *     parameters:
 *       - in: path
 *         name: id_propuesta
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID de la propuesta
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
 *         description: Propuesta no encontrada
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