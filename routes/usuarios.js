const { Router } = require('express');
const { check } = require('express-validator');
const { validarCampos } = require('../middlewares/validar-campos');
const { getAllUsuarios, crearUsuario, loginUsuario, revalidarToken, getUsuario, getUsuarios, actualizarUsuario, eliminarUsuario } = require('../controllers/usuarios');
const { validarJWT } = require('../middlewares/validar-jwt');
const { passwordFuerte } = require('../helpers/validar-password');

const router = Router();

router.post(
    '/new',
    [
        check('nombre', 'El nombre es obligatorio').not().isEmpty(),
        check('correo', 'El correo es obligatorio').isEmail(),
        check('contrasenia').custom(passwordFuerte),
        check('tipo', 'El tipo es obligatorio').not().isEmpty(),
        validarCampos
    ],
    crearUsuario
);
/**
 * @swagger
 * /api/usuarios/new:
 *   post:
 *     summary: Crear un nuevo usuario
 *     description: Crea un nuevo usuario con contraseña encriptada y genera un JWT.
 *     tags:
 *       - Usuarios
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nombre:
 *                 type: string
 *                 description: Nombre del usuario
 *                 example: Juan Pérez
 *               correo:
 *                 type: string
 *                 description: Correo electrónico del usuario
 *                 example: juan.perez@example.com
 *               contrasenia:
 *                 type: string
 *                 description: Contraseña del usuario
 *                 example: Password123!
 *               tipo:
 *                 type: string
 *                 description: Tipo de usuario
 *                 example: Administrador
 *             required:
 *               - nombre
 *               - correo
 *               - contrasenia
 *               - tipo
 *     responses:
 *       '201':
 *         description: Usuario creado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 ok:
 *                   type: boolean
 *                   example: true
 *                 uid:
 *                   type: integer
 *                   example: 1
 *                 nombre:
 *                   type: string
 *                   example: Juan Pérez
 *                 correo:
 *                   type: string
 *                   example: juan.perez@example.com
 *                 token:
 *                   type: string
 *                   example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *       '400':
 *         description: Correo ya registrado
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
 *                   example: El correo ya está registrado
 *       '500':
 *         description: Error al crear el usuario
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
 *                   example: Hable con el administrador
 */

router.post(
    '/',
    [
        check('correo', 'El correo es obligatorio').isEmail(),
        check('contrasenia').custom(passwordFuerte),
        validarCampos
    ],
    loginUsuario
);
/**
 * @swagger
 * /api/usuarios/:
 *   post:
 *     summary: Iniciar sesión
 *     description: Autentica un usuario y genera un JWT.
 *     tags:
 *       - Usuarios
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               correo:
 *                 type: string
 *                 description: Correo electrónico del usuario
 *                 example: juan.perez@example.com
 *               contrasenia:
 *                 type: string
 *                 description: Contraseña del usuario
 *                 example: Password123!
 *             required:
 *               - correo
 *               - contrasenia
 *     responses:
 *       '200':
 *         description: Autenticación exitosa
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 ok:
 *                   type: boolean
 *                   example: true
 *                 uid:
 *                   type: integer
 *                   example: 1
 *                 correo:
 *                   type: string
 *                   example: juan.perez@example.com
 *                 token:
 *                   type: string
 *                   example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *       '400':
 *         description: Credenciales inválidas
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
 *                   example: Usuario no existe o Contraseña incorrecta
 *       '500':
 *         description: Error al iniciar sesión
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
 *                   example: Hable con el administrador
 */

router.get('/renew', validarJWT, revalidarToken);
/**
 * @swagger
 * /api/usuarios/renew:
 *   get:
 *     summary: Revalidar token
 *     description: Genera un nuevo JWT para un usuario autenticado.
 *     tags:
 *       - Usuarios
 *     security:
 *       - xToken: []
 *     responses:
 *       '200':
 *         description: Token revalidado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 ok:
 *                   type: boolean
 *                   example: true
 *                 uid:
 *                   type: integer
 *                   example: 1
 *                 correo:
 *                   type: string
 *                   example: juan.perez@example.com
 *                 token:
 *                   type: string
 *                   example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *       '400':
 *         description: Faltan datos del usuario
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
 *                   example: Faltan datos del usuario
 *       '500':
 *         description: Error al generar el token
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
 *                   example: Error al generar el token
 */

router.get('/', getUsuarios);
/**
 * @swagger
 * /api/usuarios/:
 *   get:
 *     summary: Obtener todos los usuarios activos
 *     description: Devuelve una lista paginada de usuarios activos (no eliminados).
 *     tags:
 *       - Usuarios
 *     security:
 *       - xToken: []
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
 *         description: Cantidad de usuarios por página
 *     responses:
 *       '200':
 *         description: Lista de usuarios activos
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 ok:
 *                   type: boolean
 *                   example: true
 *                 usuarios:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Usuario'
 *                 totalItems:
 *                   type: integer
 *                   example: 50
 *                 totalPages:
 *                   type: integer
 *                   example: 5
 *                 currentPage:
 *                   type: integer
 *                   example: 1
 *       '500':
 *         description: Error al obtener los usuarios
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
 *                   example: Error al obtener los usuarios
 */

router.get('/all', validarJWT, getAllUsuarios);
/**
 * @swagger
 * /api/usuarios/all:
 *   get:
 *     summary: Obtener todos los usuarios (incluidos eliminados)
 *     description: Devuelve una lista paginada de todos los usuarios, incluidos los eliminados lógicamente.
 *     tags:
 *       - Usuarios
 *     security:
 *       - xToken: []
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
 *         description: Cantidad de usuarios por página
 *     responses:
 *       '200':
 *         description: Lista de todos los usuarios
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 ok:
 *                   type: boolean
 *                   example: true
 *                 usuarios:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Usuario'
 *                 totalItems:
 *                   type: integer
 *                   example: 60
 *                 totalPages:
 *                   type: integer
 *                   example: 6
 *                 currentPage:
 *                   type: integer
 *                   example: 1
 *       '500':
 *         description: Error al obtener todos los usuarios
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
 *                   example: Error al obtener todos los usuarios
 */

router.get('/:id', validarJWT, getUsuario);
/**
 * @swagger
 * /api/usuarios/{id}:
 *   get:
 *     summary: Obtener un usuario por ID
 *     description: Devuelve los detalles de un usuario activo por su ID.
 *     tags:
 *       - Usuarios
 *     security:
 *       - xToken: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID del usuario
 *     responses:
 *       '200':
 *         description: Detalles del usuario
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 ok:
 *                   type: boolean
 *                   example: true
 *                 usuario:
 *                   $ref: '#/components/schemas/Usuario'
 *       '404':
 *         description: Usuario no encontrado
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
 *                   example: Usuario no encontrado
 *       '500':
 *         description: Error al obtener el usuario
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
 *                   example: Error al obtener usuario
 */

router.put('/:id', validarJWT, [
    check('id', 'El ID debe ser un número válido').isInt(),
    check('tipo', 'El tipo es obligatorio').not().isEmpty(),
    check('correo', 'El correo es obligatorio').isEmail(),
    validarCampos
], actualizarUsuario);
/**
 * @swagger
 * /api/usuarios/{id}:
 *   put:
 *     summary: Actualizar un usuario
 *     description: Actualiza los datos de un usuario activo por su ID.
 *     tags:
 *       - Usuarios
 *     security:
 *       - xToken: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID del usuario
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nombre:
 *                 type: string
 *                 description: Nombre del usuario
 *                 example: Juan Pérez
 *               correo:
 *                 type: string
 *                 description: Correo electrónico del usuario
 *                 example: juan.perez@example.com
 *               tipo:
 *                 type: string
 *                 description: Tipo de usuario
 *                 example: Administrador
 *             required:
 *               - tipo
 *               - nombre
 *               - correo
 *     responses:
 *       '200':
 *         description: Usuario actualizado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 ok:
 *                   type: boolean
 *                   example: true
 *                 usuario:
 *                   $ref: '#/components/schemas/Usuario'
 *       '404':
 *         description: Usuario no encontrado
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
 *                   example: Usuario no encontrado
 *       '500':
 *         description: Error al actualizar el usuario
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
 *                   example: Error al actualizar el usuario
 */

router.patch('/:id', validarJWT, [
    check('id', 'El ID debe ser un número válido').isInt(),
    validarCampos
], eliminarUsuario);

/**
 * @swagger
 * /api/usuarios/{id}:
 *   patch:
 *     summary: Eliminar un usuario lógicamente
 *     description: Marca un usuario como eliminado lógicamente por su ID.
 *     tags:
 *       - Usuarios
 *     security:
 *       - xToken: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID del usuario
 *     responses:
 *       '200':
 *         description: Usuario eliminado correctamente
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
 *                   example: Usuario eliminado correctamente
 *       '404':
 *         description: Usuario no encontrado
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
 *                   example: Usuario no encontrado
 *       '500':
 *         description: Error al eliminar el usuario
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
 *                   example: Error al eliminar el usuario
 */

module.exports = router;
