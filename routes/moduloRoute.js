const { Router } = require('express');
const { check } = require('express-validator');
const { validarCampos } = require('../middlewares/validar-campos');
const { getModulos, getModuloById, crearModulo, actualizarModulo, eliminarModulo } = require('../controllers/modulos');
const { validarJWT } = require('../middlewares/validar-jwt');
const { validarPermiso } = require('../middlewares/validarPermiso');

const router = Router();

router.get('/', validarJWT, validarPermiso('VER_ROLES'), getModulos);

router.get('/:id', validarJWT, validarPermiso('VER_ROLES'), [
    check('id', 'El ID debe ser un número válido').isInt(),
    validarCampos
], getModuloById);

router.post('/new', validarJWT, validarPermiso('CREAR_PERMISO'), [
    check('nombre', 'El nombre es obligatorio').not().isEmpty(),
    check('descripcion').optional().trim(),
    validarCampos
], crearModulo);

router.put('/:id', validarJWT, validarPermiso('ASIGNAR_PERMISOS'), [
    check('id', 'El ID debe ser un número válido').isInt(),
    check('nombre').optional().trim().notEmpty(),
    check('descripcion').optional().trim(),
    validarCampos
], actualizarModulo);

router.patch('/:id', validarJWT, validarPermiso('ASIGNAR_PERMISOS'), [
    check('id', 'El ID debe ser un número válido').isInt(),
    validarCampos
], eliminarModulo);

module.exports = router;
