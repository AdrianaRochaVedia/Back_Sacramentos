const { Router } = require('express');
const { check } = require('express-validator');
const { validarCampos } = require('../middlewares/validar-campos');
const { getAllTiposSacramento, crearTipoSacramento, getTipoSacramento, getTiposSacramento, actualizarTipoSacramento } = require('../controllers/tiposacramentos');
const { validarJWT } = require('../middlewares/validar-jwt');
const { validarPermiso } = require('../middlewares/validarPermiso');

const router = Router();

router.get('/', validarJWT, validarPermiso('VER_SACRAMENTOS'), getTiposSacramento);

router.get('/all', validarJWT, validarPermiso('VER_SACRAMENTOS'), getAllTiposSacramento);

router.get('/:id', validarJWT, validarPermiso('VER_SACRAMENTOS'), getTipoSacramento);

router.post('/new', validarJWT, validarPermiso('CREAR_SACRAMENTO'), [
    check('nombre', 'El nombre es obligatorio').not().isEmpty(),
    check('descripcion', 'La descripción es obligatoria').not().isEmpty(),
    validarCampos
], crearTipoSacramento);

router.put('/:id', validarJWT, validarPermiso('EDITAR_SACRAMENTO'), [
    check('id', 'El ID debe ser un número válido').isInt(),
    check('nombre').optional().trim().notEmpty(),
    check('descripcion').optional().trim().notEmpty(),
    validarCampos
], actualizarTipoSacramento);

module.exports = router;