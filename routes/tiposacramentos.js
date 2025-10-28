const { Router } = require('express');
const { check } = require('express-validator');
const { validarCampos } = require('../middlewares/validar-campos');
const { getAllTiposSacramento, crearTipoSacramento, getTipoSacramento, getTiposSacramento, actualizarTipoSacramento } = require('../controllers/tiposacramentos');
const { validarJWT } = require('../middlewares/validar-jwt');

const router = Router();

router.post(
    '/new',
     validarJWT,
    [

        check('nombre', 'El nombre es obligatorio').not().isEmpty(),
        check('descripcion', 'La descripción es obligatoria').not().isEmpty(),
        validarCampos
    ],
    crearTipoSacramento
);

router.get('/', validarJWT,getTiposSacramento);

router.get('/all', validarJWT, getAllTiposSacramento);

router.get('/:id', validarJWT, getTipoSacramento);

router.put('/:id', validarJWT, [
    check('id', 'El ID debe ser un número válido').isInt(),
    check('nombre').optional().trim().notEmpty(),
    check('descripcion').optional().trim().notEmpty(),
    validarCampos
], actualizarTipoSacramento);

// router.patch('/:id', validarJWT, [
//     check('id', 'El ID debe ser un número válido').isInt(),
//     validarCampos
// ], eliminarTipoSacramento);


module.exports = router;
