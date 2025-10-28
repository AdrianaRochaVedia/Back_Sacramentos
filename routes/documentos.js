/*
    Rutas de documentos / Documentos
    host + /api/documentos
*/

const { Router } = require('express');
const { validarJWT } = require('../middlewares/validar-jwt'); // Asumiendo que tienes este middleware
const { generarJWT } = require('../helpers/jwt');
const { validarCampos } = require('../middlewares/validar-campos');
const { check } = require('express-validator');

const { 
    getDocumentos,
    getDocumento,
    crearDocumento,
    actualizarDocumento,
    eliminarDocumento,
    // Nuevos métodos de búsqueda
    buscarPorNombre,
    buscarPorPalabrasClave,
    buscarPorTipo,
    buscarPorAnio,
    buscarPorFuente,
    filtradoInteligente
} = require('../controllers/documentos');

const router = Router();


router.get('/', getDocumentos);
/**
 * @swagger
 * /api/documentos:
 *   get:
 *     summary: Obtener todos los documentos activos
 *     description: Devuelve una lista paginada de documentos activos (no eliminados).
 *     tags:
 *       - Documentos
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Número de página para la paginación
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Cantidad de documentos por página
 *     responses:
 *       '200':
 *         description: Lista de documentos activos
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 ok:
 *                   type: boolean
 *                   example: true
 *                 total:
 *                   type: integer
 *                   example: 50
 *                 page:
 *                   type: integer
 *                   example: 1
 *                 totalPages:
 *                   type: integer
 *                   example: 5
 *                 documentos:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Documento'
 *       '500':
 *         description: Error al obtener los documentos
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
 *                   example: Error al obtener los documentos
 */

router.post('/', validarJWT, [
    check('nombre', 'El nombre es obligatorio').not().isEmpty(),
    check('tipo', 'El tipo es obligatorio').not().isEmpty(),
    check('fuente_origen', 'La fuente de origen es obligatoria').not().isEmpty(),
    check('descripcion', 'La descripción es obligatoria').not().isEmpty(),
    check('importancia', 'La importancia es obligatoria').not().isEmpty(),
    check('enlace', 'El enlace debe ser una URL válida').optional().isURL(),
    check('anio_publicacion', 'El año de publicación debe ser una fecha válida').optional().isDate(),
    check('concepto_basico', 'El concepto básico es obligatorio').not().isEmpty(),
    check('aplicacion', 'La aplicación es obligatoria').not().isEmpty(),
    check('cpe', 'El CPE es obligatorio').not().isEmpty(),
    check('jerarquia', 'La jerarquía es obligatoria').not().isEmpty(),
    validarCampos
], crearDocumento);
/**
 * @swagger
 * /api/documentos:
 *   post:
 *     summary: Crear un nuevo documento
 *     description: Crea un nuevo documento asociado al usuario autenticado.
 *     tags:
 *       - Documentos
 *     security:
 *       - xToken: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nombre:
 *                 type: string
 *                 description: Nombre del documento
 *                 example: Informe Anual 2025
 *               tipo:
 *                 type: string
 *                 description: Tipo de documento
 *                 example: Informe
 *               fuente_origen:
 *                 type: string
 *                 description: Fuente de origen del documento
 *                 example: Gobierno
 *               descripcion:
 *                 type: string
 *                 description: Descripción del documento
 *                 example: Informe sobre políticas públicas
 *               importancia:
 *                 type: string
 *                 description: Nivel de importancia
 *                 example: Alta
 *               anio_publicacion:
 *                 type: string
 *                 format: date
 *                 description: Año de publicación
 *                 example: 2025-01-01
 *               enlace:
 *                 type: string
 *                 description: URL del documento
 *                 example: https://example.com/documento.pdf
 *               concepto_basico:
 *                 type: string
 *                 description: Concepto básico del documento
 *                 example: Políticas públicas para 2025
 *               aplicacion:
 *                 type: string
 *                 description: Aplicación del documento
 *                 example: Gestión pública
 *               cpe:
 *                 type: string
 *                 description: Código de procedimiento específico
 *                 example: CPE-123
 *               jerarquia:
 *                 type: string
 *                 description: Jerarquía del documento
 *                 example: Nacional
 *             required:
 *               - nombre
 *               - tipo
 *               - fuente_origen
 *               - descripcion
 *               - importancia
 *               - anio_publicacion
 *               - enlace
 *               - concepto_basico
 *               - aplicacion
 *               - cpe
 *               - jerarquia
 *     responses:
 *       '201':
 *         description: Documento creado exitosamente
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
 *       '400':
 *         description: Error en los datos proporcionados
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
 *                   example: Fecha de publicación inválida
 *       '401':
 *         description: No autorizado
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
 *                   example: Token no válido
 *       '500':
 *         description: Error al crear el documento
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
 *                   example: Error al crear el documento
 */

router.get('/:id', [
    check('id', 'El ID debe ser un número válido').isInt(),
    validarCampos
], getDocumento);
/**
 * @swagger
 * /api/documentos/{id}:
 *   get:
 *     summary: Obtener un documento por ID
 *     description: Devuelve los detalles de un documento activo por su ID e incrementa las vistas.
 *     tags:
 *       - Documentos
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID del documento
 *     responses:
 *       '200':
 *         description: Detalles del documento
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
 *         description: Documento no encontrado
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
 *                   example: Documento no encontrado
 *       '500':
 *         description: Error al obtener el documento
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
 *                   example: Error al obtener el documento
 */

router.put('/:id', validarJWT, [
    check('id', 'El ID debe ser un número válido').isInt(),
    check('nombre', 'El nombre es obligatorio').not().isEmpty(),
    check('tipo', 'El tipo es obligatorio').not().isEmpty(),
    check('fuente_origen', 'La fuente de origen es obligatoria').not().isEmpty(),
    check('descripcion', 'La descripción es obligatoria').not().isEmpty(),
    check('importancia', 'La importancia es obligatoria').not().isEmpty(),
    check('enlace', 'El enlace debe ser una URL válida').optional().isURL(),
    check('anio_publicacion', 'El año de publicación debe ser una fecha válida').optional().isDate(),
    check('concepto_basico', 'El concepto básico es obligatorio').not().isEmpty(),
    check('aplicacion', 'La aplicación es obligatoria').not().isEmpty(),
    check('cpe', 'El CPE es obligatorio').not().isEmpty(),
    check('jerarquia', 'La jerarquía es obligatoria').not().isEmpty(),
    validarCampos
], actualizarDocumento);
/**
 * @swagger
 * /api/documentos/{id}:
 *   put:
 *     summary: Actualizar un documento
 *     description: Actualiza un documento existente y guarda la versión anterior.
 *     tags:
 *       - Documentos
 *     security:
 *       - xToken: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID del documento
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nombre:
 *                 type: string
 *                 description: Nombre del documento
 *                 example: Informe Anual 2025
 *               tipo:
 *                 type: string
 *                 description: Tipo de documento
 *                 example: Informe
 *               fuente_origen:
 *                 type: string
 *                 description: Fuente de origen del documento
 *                 example: Gobierno
 *               descripcion:
 *                 type: string
 *                 description: Descripción del documento
 *                 example: Informe sobre políticas públicas
 *               importancia:
 *                 type: string
 *                 description: Nivel de importancia
 *                 example: Alta
 *               anio_publicacion:
 *                 type: string
 *                 format: date
 *                 description: Año de publicación
 *                 example: 2025-01-01
 *               enlace:
 *                 type: string
 *                 description: URL del documento
 *                 example: https://example.com/documento.pdf
 *               concepto_basico:
 *                 type: string
 *                 description: Concepto básico del documento
 *                 example: Políticas públicas para 2025
 *               aplicacion:
 *                 type: string
 *                 description: Aplicación del documento
 *                 example: Gestión pública
 *               cpe:
 *                 type: string
 *                 description: Código de procedimiento específico
 *                 example: CPE-123
 *               jerarquia:
 *                 type: string
 *                 description: Jerarquía del documento
 *                 example: Nacional
 *             required:
 *               - nombre
 *               - tipo
 *               - fuente_origen
 *               - descripcion
 *               - importancia
 *               - anio_publicacion
 *               - enlace
 *               - concepto_basico
 *               - aplicacion
 *               - cpe
 *               - jerarquia
 *     responses:
 *       '200':
 *         description: Documento actualizado exitosamente
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
 *       '403':
 *         description: No autorizado para modificar el documento
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
 *                   example: No tiene permisos para modificar este documento
 *       '404':
 *         description: Documento no encontrado
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
 *                   example: Documento no encontrado
 *       '500':
 *         description: Error al actualizar el documento
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
 *                   example: Error al actualizar el documento
 */

router.patch('/:id', validarJWT, [
    check('id', 'El ID debe ser un número válido').isInt(),
    validarCampos
], eliminarDocumento);
/**
 * @swagger
 * /api/documentos/{id}:
 *   patch:
 *     summary: Eliminar un documento lógicamente
 *     description: Marca un documento como eliminado lógicamente por su ID.
 *     tags:
 *       - Documentos
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
 *         description: Documento eliminado correctamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 ok:
 *                   type: boolean
 *                   example: true
 *                 msg:
 *                   type: string
 *                   example: Documento eliminado correctamente
 *       '403':
 *         description: No autorizado para eliminar el documento
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
 *                   example: No tiene permisos para eliminar este documento
 *       '404':
 *         description: Documento no encontrado
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
 *                   example: Documento no encontrado
 *       '500':
 *         description: Error al eliminar el documento
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
 *                   example: Error al eliminar el documento
 */

router.get('/buscar/nombre', validarJWT, buscarPorNombre);
/**
 * @swagger
 * /api/documentos/buscar/nombre:
 *   get:
 *     summary: Buscar documentos por nombre
 *     description: Busca documentos activos por coincidencia parcial en el nombre.
 *     tags:
 *       - Documentos
 *     security:
 *       - xToken: []
 *     parameters:
 *       - in: query
 *         name: nombre
 *         schema:
 *           type: string
 *         required: true
 *         description: Nombre parcial del documento
 *     responses:
 *       '200':
 *         description: Lista de documentos encontrados
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 ok:
 *                   type: boolean
 *                   example: true
 *                 documentos:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Documento'
 *       '400':
 *         description: Parámetro nombre requerido
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
 *                   example: El parámetro nombre es requerido
 *       '500':
 *         description: Error en la búsqueda
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
 *                   example: Error en la búsqueda de documentos por nombre
 */

router.get('/buscar/palabras-clave', validarJWT, buscarPorPalabrasClave);
/**
 * @swagger
 * /api/documentos/buscar/palabras-clave:
 *   get:
 *     summary: Buscar documentos por palabras clave
 *     description: Busca documentos activos por palabras clave en descripción, concepto básico o palabras procesadas.
 *     tags:
 *       - Documentos
 *     security:
 *       - xToken: []
 *     parameters:
 *       - in: query
 *         name: palabras_clave
 *         schema:
 *           type: string
 *         required: true
 *         description: Palabras clave para la búsqueda
 *     responses:
 *       '200':
 *         description: Lista de documentos encontrados
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 ok:
 *                   type: boolean
 *                   example: true
 *                 documentos:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Documento'
 *       '400':
 *         description: Parámetro palabras_clave requerido
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
 *                   example: El parámetro palabras_clave es requerido
 *       '500':
 *         description: Error en la búsqueda
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
 *                   example: Error en la búsqueda de documentos por palabras clave
 */

router.get('/buscar/tipo', validarJWT, buscarPorTipo);
/**
 * @swagger
 * /api/documentos/buscar/tipo:
 *   get:
 *     summary: Buscar documentos por tipo
 *     description: Busca documentos activos por tipo.
 *     tags:
 *       - Documentos
 *     security:
 *       - xToken: []
 *     parameters:
 *       - in: query
 *         name: tipo
 *         schema:
 *           type: string
 *         required: true
 *         description: Tipo de documento
 *     responses:
 *       '200':
 *         description: Lista de documentos encontrados
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 ok:
 *                   type: boolean
 *                   example: true
 *                 documentos:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Documento'
 *       '400':
 *         description: Parámetro tipo requerido
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
 *                   example: El parámetro tipo es requerido
 *       '500':
 *         description: Error en la búsqueda
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
 *                   example: Error en la búsqueda de documentos por tipo
 */

router.get('/buscar/anio', validarJWT, buscarPorAnio);
/**
 * @swagger
 * /api/documentos/buscar/anio:
 *   get:
 *     summary: Buscar documentos por año de publicación
 *     description: Busca documentos activos por año de publicación.
 *     tags:
 *       - Documentos
 *     security:
 *       - xToken: []
 *     parameters:
 *       - in: query
 *         name: anio
 *         schema:
 *           type: integer
 *         required: true
 *         description: Año de publicación
 *     responses:
 *       '200':
 *         description: Lista de documentos encontrados
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 ok:
 *                   type: boolean
 *                   example: true
 *                 documentos:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Documento'
 *       '400':
 *         description: Parámetro anio requerido
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
 *                   example: El parámetro anio es requerido
 *       '500':
 *         description: Error en la búsqueda
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
 *                   example: Error en la búsqueda de documentos por año
 */

router.get('/buscar/fuente', validarJWT, buscarPorFuente);
/**
 * @swagger
 * /api/documentos/buscar/fuente:
 *   get:
 *     summary: Buscar documentos por fuente de origen
 *     description: Busca documentos activos por fuente de origen.
 *     tags:
 *       - Documentos
 *     security:
 *       - xToken: []
 *     parameters:
 *       - in: query
 *         name: fuente
 *         schema:
 *           type: string
 *         required: true
 *         description: Fuente de origen del documento
 *     responses:
 *       '200':
 *         description: Lista de documentos encontrados
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 ok:
 *                   type: boolean
 *                   example: true
 *                 documentos:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Documento'
 *       '400':
 *         description: Parámetro fuente requerido
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
 *                   example: El parámetro fuente es requerido
 *       '500':
 *         description: Error en la búsqueda
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
 *                   example: Error en la búsqueda de documentos por fuente
 */

router.get('/buscar/inteligente', validarJWT, filtradoInteligente);
/**
 * @swagger
 * /api/documentos/buscar/inteligente:
 *   get:
 *     summary: Filtrado inteligente de documentos
 *     description: Busca documentos activos basándose en palabras clave relevantes extraídas de documentos más vistos.
 *     tags:
 *       - Documentos
 *     security:
 *       - xToken: []
 *     responses:
 *       '200':
 *         description: Lista de documentos encontrados
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 ok:
 *                   type: boolean
 *                   example: true
 *                 documentos:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Documento'
 *                 palabrasRelevantes:
 *                   type: array
 *                   items:
 *                     type: string
 *                   example: ["política", "gestión", "pública"]
 *       '500':
 *         description: Error en el filtrado inteligente
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
 *                   example: Error en el filtrado inteligente de documentos
 */

module.exports = router;