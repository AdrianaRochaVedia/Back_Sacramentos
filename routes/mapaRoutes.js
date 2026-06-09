const { Router } = require('express');
const { getResumenMapa } = require('../controllers/mapa');
const { validarJWT } = require('../middlewares/validar-jwt');
const { validarPermiso } = require('../middlewares/validarPermiso');

const router = Router();

/**
 * @swagger
 * /api/mapa/resumen:
 *   get:
 *     summary: Resumen geográfico de parroquias para el mapa
 *     tags: [Mapa]
 *     security:
 *       - xToken: []
 *     responses:
 *       200:
 *         description: Lista de parroquias con coordenadas y conteos de sacramentos
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 ok:
 *                   type: boolean
 *                 parroquias:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id_parroquia:      { type: integer }
 *                       nombre:            { type: string }
 *                       direccion:         { type: string }
 *                       latitud:           { type: number }
 *                       longitud:          { type: number }
 *                       total_sacramentos: { type: integer }
 *                       bautismos:         { type: integer }
 *                       matrimonios:       { type: integer }
 *                       confirmaciones:    { type: integer }
 *                       comuniones:        { type: integer }
 *                       total_fieles:      { type: integer }
 *                 meta:
 *                   type: object
 *                   properties:
 *                     total:            { type: integer }
 *                     sin_coordenadas:  { type: integer }
 */
router.get('/resumen', validarJWT, validarPermiso('VER_PARROQUIAS'), getResumenMapa);

module.exports = router;
