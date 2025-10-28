const { Router } = require('express');
const { check } = require('express-validator');
const { validarCampos } = require('../middlewares/validar-campos');
const { crearRolSacramento, getRolSacramento, getRolesSacramento, actualizarRolSacramento } = require('../controllers/rolsacramento');
const { validarJWT } = require('../middlewares/validar-jwt');

const router = Router();

router.post(
    '/new',
     validarJWT,
    [
        check('nombre', 'El nombre es obligatorio').not().isEmpty(),
        validarCampos
    ],
    crearRolSacramento
);

router.get('/', validarJWT,getRolesSacramento);

router.get('/:id', validarJWT, getRolSacramento);

router.put('/:id', validarJWT, [
    check('id', 'El ID debe ser un número válido').isInt(),
    check('nombre').optional().trim().notEmpty(),
    validarCampos
], actualizarRolSacramento);

// router.patch('/:id', validarJWT, [
//     check('id', 'El ID debe ser un número válido').isInt(),
//     validarCampos
// ], eliminarParroquia);


module.exports = router;
