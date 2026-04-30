const { Router } = require('express');
const { check } = require('express-validator');
const { validarCampos } = require('../middlewares/validar-campos');
const {
  getAllUsuarios,
  crearUsuario,
  loginUsuario,
  verificarCodigo2FA,
  revalidarToken,
  getUsuario,
  getUsuarios,
  actualizarUsuario,
  eliminarUsuario
} = require('../controllers/usuarios');
const { validarJWT } = require('../middlewares/validar-jwt');
const { passwordFuerte } = require('../helpers/validar-password');
const { validarPermiso } = require('../middlewares/validarPermiso');

const router = Router();

router.post('/', [
    check('email', 'El email es obligatorio').isEmail(),
    check('password', 'La contraseña es obligatoria').notEmpty(),
    validarCampos
], loginUsuario);
router.post('/verificar-2fa', [
  check('token2FA', 'El token temporal es obligatorio').notEmpty(),
  check('codigo', 'El código debe tener 6 dígitos').isLength({ min: 6, max: 6 }),
  validarCampos
], verificarCodigo2FA);
router.get('/renew', validarJWT, revalidarToken);

router.post('/new', validarJWT, validarPermiso('CREAR_USUARIO'), [
    check('nombre', 'El nombre es obligatorio').not().isEmpty(),
    check('apellido_paterno', 'El apellido paterno es obligatorio').not().isEmpty(),
    check('apellido_materno', 'El apellido materno es obligatorio').not().isEmpty(),
    check('email', 'El email es obligatorio').isEmail(),
    check('password')
        .optional({ nullable: true, checkFalsy: true })
        .custom(async (valor) => await passwordFuerte(valor)),
    check('fecha_nacimiento', 'La fecha de nacimiento es obligatoria').isDate(),
    check('id_rol').optional().isInt().withMessage('El rol debe ser un número entero'),
    validarCampos
], crearUsuario);

router.get('/', validarJWT, validarPermiso('VER_USUARIOS'), getUsuarios);

router.get('/all', validarJWT, validarPermiso('VER_USUARIOS'), getAllUsuarios);

router.get('/:id', validarJWT, validarPermiso('VER_USUARIOS'), getUsuario);

router.put('/:id', validarJWT, validarPermiso('EDITAR_USUARIO'), [
    check('id', 'El ID debe ser un número válido').isInt(),
    check('email').optional().isEmail().withMessage('El email no es válido'),
    check('id_rol').optional().isInt().withMessage('El rol debe ser un número entero'),
    check('password')
        .optional({ nullable: true, checkFalsy: true })
        .custom(async (valor) => await passwordFuerte(valor)),
    validarCampos
], actualizarUsuario);

router.patch('/:id', validarJWT, validarPermiso('DESACTIVAR_USUARIO'), [
    check('id', 'El ID debe ser un número válido').isInt(),
    validarCampos
], eliminarUsuario);

module.exports = router;