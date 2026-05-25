const { Router } = require('express');
const { check } = require('express-validator');
const { validarCampos } = require('../middlewares/validar-campos');
const { getPermisos, getPermisoById, crearPermiso, actualizarPermiso, eliminarPermiso } = require('../controllers/permisos');
const { validarJWT } = require('../middlewares/validar-jwt');
const { validarPermiso } = require('../middlewares/validarPermiso');

const router = Router();

router.get('/', validarJWT, validarPermiso('VER_ROLES'), getPermisos);

router.get('/:id', validarJWT, validarPermiso('VER_ROLES'), getPermisoById);

router.post('/new', validarJWT, validarPermiso('CREAR_PERMISO'), [
    check('nombre', 'El nombre es obligatorio').not().isEmpty(),
    check('descripcion').optional().trim(),
    validarCampos
], crearPermiso);

router.put('/:id', validarJWT, validarPermiso('ASIGNAR_PERMISOS'), [
    check('id', 'El ID debe ser un número válido').isInt(),
    check('nombre').optional().trim().notEmpty(),
    check('descripcion').optional().trim(),
    validarCampos
], actualizarPermiso);

router.patch('/:id', validarJWT, validarPermiso('ASIGNAR_PERMISOS'), [
    check('id', 'El ID debe ser un número válido').isInt(),
    validarCampos
], eliminarPermiso);

module.exports = router;