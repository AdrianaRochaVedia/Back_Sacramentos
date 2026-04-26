const { Router } = require('express');
const { check } = require('express-validator');
const { validarCampos } = require('../middlewares/validar-campos');
const { getPermisos, getPermisoById, crearPermiso, actualizarPermiso, eliminarPermiso } = require('../controllers/permisos');
const { validarJWT } = require('../middlewares/validar-jwt');

const router = Router();

router.post(
    '/new',
    validarJWT,
    [
        check('nombre', 'El nombre es obligatorio').not().isEmpty(),
        check('descripcion').optional().trim(),
        validarCampos
    ],
    crearPermiso
);

router.get('/', validarJWT, getPermisos);

router.get('/:id', validarJWT, getPermisoById);

router.put('/:id', validarJWT, [
    check('id', 'El ID debe ser un número válido').isInt(),
    check('nombre').optional().trim().notEmpty(),
    check('descripcion').optional().trim(),
    validarCampos
], actualizarPermiso);

router.patch('/:id', validarJWT, [
    check('id', 'El ID debe ser un número válido').isInt(),
    validarCampos
], eliminarPermiso);

module.exports = router;