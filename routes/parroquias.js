const { Router } = require('express');
const { check } = require('express-validator');
const { validarCampos } = require('../middlewares/validar-campos');
const { crearParroquia, getParroquia, getParroquias, actualizarParroquia } = require('../controllers/parroquias');
const { validarJWT } = require('../middlewares/validar-jwt');
const { validarPermiso } = require('../middlewares/validarPermiso');

const router = Router();

router.post(
    '/new',
     validarJWT,
     validarPermiso('CREAR_PARROQUIA'),
    [
        check('nombre', 'El nombre es obligatorio').not().isEmpty(),
        check('direccion', 'La dirección es obligatoria').not().isEmpty(),
        check('telefono', 'El teléfono es obligatorio').not().isEmpty(),
        check('email', 'El email es obligatorio').isEmail(),
        validarCampos
    ],
    crearParroquia
);

router.get('/', validarJWT, validarPermiso('VER_PARROQUIAS'),getParroquias);

router.get('/:id', validarJWT, validarPermiso('VER_PARROQUIAS'), getParroquia);

router.put('/:id', validarJWT, validarPermiso('EDITAR_PARROQUIA'),[
    check('id', 'El ID debe ser un número válido').isInt(),
    check('nombre').optional().trim().notEmpty(),
    check('direccion').optional().trim().notEmpty(),
    check('telefono').optional().trim().notEmpty(),
    check('email').optional().isEmail(),
    validarCampos
], actualizarParroquia);

// router.patch('/:id', validarJWT, [
//     check('id', 'El ID debe ser un número válido').isInt(),
//     validarCampos
// ], eliminarParroquia);


module.exports = router;
