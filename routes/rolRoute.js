const { Router } = require('express');
const { check } = require('express-validator');
const { validarCampos } = require('../middlewares/validar-campos');
const { getRoles, getRolById, crearRol, actualizarRol, eliminarRol } = require('../controllers/rol');
const { validarJWT } = require('../middlewares/validar-jwt');
const { validarPermiso } = require('../middlewares/validarPermiso');

const router = Router();

router.get('/', validarJWT, validarPermiso('VER_ROLES'), getRoles);

router.get('/:id', validarJWT, validarPermiso('VER_ROLES'), getRolById);

router.post('/new', validarJWT, validarPermiso('CREAR_ROL'), [
    check('nombre', 'El nombre es obligatorio').not().isEmpty(),
    check('permisos', 'Los permisos deben ser un arreglo').optional().isArray(),
    check('permisos.*', 'Cada permiso debe ser un número entero').optional().isInt(),
    validarCampos
], crearRol);

router.put('/:id', validarJWT, validarPermiso('EDITAR_ROL'), [
    check('id', 'El ID debe ser un número válido').isInt(),
    check('nombre').optional().trim().notEmpty(),
    check('permisos', 'Los permisos deben ser un arreglo').optional().isArray(),
    check('permisos.*', 'Cada permiso debe ser un número entero').optional().isInt(),
    validarCampos
], actualizarRol);

router.patch('/:id', validarJWT, validarPermiso('EDITAR_ROL'), [
    check('id', 'El ID debe ser un número válido').isInt(),
    validarCampos
], eliminarRol);

module.exports = router;