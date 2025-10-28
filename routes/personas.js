const { Router } = require('express');
const { check } = require('express-validator');
const { validarCampos } = require('../middlewares/validar-campos');
const { getAllPersonas, crearPersona, getPersona, getPersonas, actualizarPersona, eliminarPersona } = require('../controllers/persona');
const { validarJWT } = require('../middlewares/validar-jwt');

const router = Router();

router.post(
    '/new',
     validarJWT,
    [

        check('nombre', 'El nombre es obligatorio').not().isEmpty(),
        check('apellido_paterno', 'El apellido paterno es obligatorio').not().isEmpty(),
        check('apellido_materno', 'El apellido materno es obligatorio').not().isEmpty(),
        check('carnet_identidad', 'El carnet de identidad es obligatorio').not().isEmpty(),
        check('fecha_nacimiento', 'La fecha de nacimiento es obligatoria').isDate(),
        check('lugar_nacimiento', 'El lugar de nacimiento es obligatorio').not().isEmpty(),
        check('nombre_padre', 'El nombre del padre es obligatorio').not().isEmpty(),
        check('nombre_madre', 'El nombre de la madre es obligatorio').not().isEmpty(),
        check('estado', 'El estado es obligatorio').not().isEmpty(),
        validarCampos
    ],
    crearPersona
);

router.get('/', validarJWT,getPersonas);

router.get('/all', validarJWT, getAllPersonas);

router.get('/:id', validarJWT, getPersona);

router.put('/:id', validarJWT, [
    check('id', 'El ID debe ser un número válido').isInt(),
    check('nombre').optional().trim().notEmpty(),
    check('apellido_paterno').optional().trim().notEmpty(),
    check('apellido_materno').optional().trim().notEmpty(),
    check('carnet_identidad').optional().trim().notEmpty(),
    check('fecha_nacimiento').optional().isISO8601(),
    check('lugar_nacimiento').optional().trim().notEmpty(),
    check('nombre_padre').optional().trim().notEmpty(),
    check('nombre_madre').optional().trim().notEmpty(),
    check('estado').optional().trim().notEmpty(),
    validarCampos
], actualizarPersona);

router.patch('/:id', validarJWT, [
    check('id', 'El ID debe ser un número válido').isInt(),
    validarCampos
], eliminarPersona);

module.exports = router;
