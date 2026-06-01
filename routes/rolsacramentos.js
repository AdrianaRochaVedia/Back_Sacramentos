const { Router } = require('express');
const { check } = require('express-validator');
const { validarCampos } = require('../middlewares/validar-campos');
const { crearRolSacramento, getRolSacramento, getRolesSacramento, actualizarRolSacramento } = require('../controllers/rolsacramento');
const { validarJWT } = require('../middlewares/validar-jwt');
const { validarPermiso } = require('../middlewares/validarPermiso');

const router = Router();

router.post(
    '/new',
     validarJWT,
    validarPermiso('CREAR_SACRAMENTO'),
    [
        check('nombre', 'El nombre es obligatorio').not().isEmpty(),
        validarCampos
    ],
    crearRolSacramento
);

router.get('/', validarJWT, validarPermiso('VER_SACRAMENTOS'), getRolesSacramento);

router.get('/:id', validarJWT, validarPermiso('VER_SACRAMENTOS'), getRolSacramento);

router.put('/:id', validarJWT, validarPermiso('EDITAR_SACRAMENTO'), [
    check('id', 'El ID debe ser un número válido').isInt(),
    check('nombre').optional().trim().notEmpty(),
    validarCampos
], actualizarRolSacramento);


module.exports = router;
