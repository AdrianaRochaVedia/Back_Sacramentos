const { Router } = require('express');
const { check } = require('express-validator');
const { validarCampos } = require('../middlewares/validar-campos');
const { getRoles, getRolById, crearRol, actualizarRol, eliminarRol } = require('../controllers/rolController');
const { validarJWT } = require('../middlewares/validar-jwt');

const router = Router();

router.post(
    '/new',
    validarJWT,
    [
        check('nombre', 'El nombre es obligatorio').not().isEmpty(),
        check('permisos', 'Los permisos deben ser un arreglo').optional().isArray(),
        check('permisos.*', 'Cada permiso debe ser un número entero').optional().isInt(),
        validarCampos
    ],
    crearRol
);

router.get('/', validarJWT, getRoles);

router.get('/:id', validarJWT, getRolById);

router.put('/:id', validarJWT, [
    check('id', 'El ID debe ser un número válido').isInt(),
    check('nombre').optional().trim().notEmpty(),
    check('permisos', 'Los permisos deben ser un arreglo').optional().isArray(),
    check('permisos.*', 'Cada permiso debe ser un número entero').optional().isInt(),
    validarCampos
], actualizarRol);

router.patch('/:id', validarJWT, [
    check('id', 'El ID debe ser un número válido').isInt(),
    validarCampos
], eliminarRol);

module.exports = router;