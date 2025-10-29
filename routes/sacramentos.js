const { Router } = require('express');
const { check } = require('express-validator');
const { validarCampos } = require('../middlewares/validar-campos');
const { getAllSacramentos, crearSacramento, getSacramento, getSacramentos, actualizarSacramento, eliminarSacramento } = require('../controllers/sacramentos');
const { validarJWT } = require('../middlewares/validar-jwt');

const router = Router();

router.post(
    '/new',
     validarJWT,
    [
        check('fecha_sacramento', 'La fecha del sacramento es obligatoria').isDate(),
        check('foja', 'La foja es obligatoria').not().isEmpty(),
        check('numero', 'El número es obligatorio').not().isEmpty(),
        validarCampos
    ],
    crearSacramento
);

router.get('/', validarJWT,getSacramentos);

router.get('/all', validarJWT, getAllSacramentos);

router.get('/:id', validarJWT, getSacramento);

router.put('/:id', validarJWT, [
    check('id', 'El ID debe ser un número válido').isInt(),
    check('fecha_sacramento', 'La fecha del sacramento es obligatoria').isDate(),
    check('foja', 'La foja es obligatoria').not().isEmpty(),
    check('numero', 'El número es obligatorio').not().isEmpty(),
    validarCampos
], actualizarSacramento);

router.patch('/:id', validarJWT, [
    check('id', 'El ID debe ser un número válido').isInt(),
    validarCampos
], eliminarSacramento);

module.exports = router;
