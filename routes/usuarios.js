const { Router } = require('express');
const { check } = require('express-validator');
const { validarCampos } = require('../middlewares/validar-campos');
const { getAllUsuarios, crearUsuario, loginUsuario, revalidarToken, getUsuario, getUsuarios, actualizarUsuario, eliminarUsuario } = require('../controllers/usuarios');
const { validarJWT } = require('../middlewares/validar-jwt');
const { passwordFuerte } = require('../helpers/validar-password');

const router = Router();

router.post(
    '/new',
    //validarJWT,
    [
        check('nombre', 'El nombre es obligatorio').not().isEmpty(),
        check('apellido_paterno', 'El apellido paterno es obligatorio').not().isEmpty(),
        check('apellido_materno', 'El apellido materno es obligatorio').not().isEmpty(),
        check('email', 'El email es obligatorio').isEmail(),
        check('password')
            .optional({ nullable: true, checkFalsy: true })
            .custom(async (valor) => await passwordFuerte(valor)),  // ← async porque consulta la BD
        check('fecha_nacimiento', 'La fecha de nacimiento es obligatoria').isDate(),
        check('id_rol').optional().isInt().withMessage('El rol debe ser un número entero'),  // ← corregido de rol a id_rol
        validarCampos
    ],
    crearUsuario
);

router.post(
    '/',
    [
        check('email', 'El email es obligatorio').isEmail(),
        check('password', 'La contraseña es obligatoria').notEmpty(),
        validarCampos
    ],
    loginUsuario
);

router.get('/renew', validarJWT, revalidarToken);

router.get('/', validarJWT, getUsuarios);

router.get('/all', validarJWT, getAllUsuarios);

router.get('/:id', validarJWT, getUsuario);

router.put('/:id', validarJWT, [
    check('id', 'El ID debe ser un número válido').isInt(),
    check('email').optional().isEmail().withMessage('El email no es válido'),  // ← opcional, no obligatorio
    check('id_rol').optional().isInt().withMessage('El rol debe ser un número entero'),  // ← corregido de rol a id_rol
    check('password')
        .optional({ nullable: true, checkFalsy: true })
        .custom(async (valor) => await passwordFuerte(valor)),  // ← validar password si se envía
    validarCampos
], actualizarUsuario);

router.patch('/:id', validarJWT, [
    check('id', 'El ID debe ser un número válido').isInt(),
    validarCampos
], eliminarUsuario);

module.exports = router;