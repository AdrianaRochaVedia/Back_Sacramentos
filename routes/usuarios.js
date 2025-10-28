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
        check('apellido_paterno', 'El apellido paterno es obligatorio').not().isEmpty(),
        check('apellido_materno', 'El apellido materno es obligatorio').not().isEmpty(),
        check('email', 'El email es obligatorio').isEmail(),
        check('password').custom(passwordFuerte),
        check('fecha_nacimiento', 'La fecha de nacimiento es obligatoria').isDate(),
        check('rol', 'El rol es obligatorio').not().isEmpty(),
        validarCampos
    ],
    crearUsuario
);

router.post(
    '/',
    [
        check('email', 'El email es obligatorio').isEmail(),
        check('password').custom(passwordFuerte),
        validarCampos
    ],
    loginUsuario
);


router.get('/renew', validarJWT, revalidarToken);


router.get('/', getUsuarios);

router.get('/all', validarJWT, getAllUsuarios);

router.get('/:id', validarJWT, getUsuario);

router.put('/:id', validarJWT, [
    check('id', 'El ID debe ser un número válido').isInt(),
    check('rol', 'El rol es obligatorio').not().isEmpty(),
    check('email', 'El email es obligatorio').isEmail(),
    validarCampos
], actualizarUsuario);

router.patch('/:id', validarJWT, [
    check('id', 'El ID debe ser un número válido').isInt(),
    validarCampos
], eliminarUsuario);

module.exports = router;
