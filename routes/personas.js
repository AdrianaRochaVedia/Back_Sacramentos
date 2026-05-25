const { Router } = require('express');
const { check } = require('express-validator');
const { validarCampos } = require('../middlewares/validar-campos');
const { getAllPersonas, crearPersona, getPersona, getPersonas, actualizarPersona, eliminarPersona, buscarPersonasParaSacramento } = require('../controllers/persona');
const { validarJWT } = require('../middlewares/validar-jwt');
const { validarPermiso } = require('../middlewares/validarPermiso');

const router = Router();

router.post(
    '/new',
     validarJWT,
     validarPermiso('CREAR_PERSONA'),
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

//endpoint para buscar personas para sacramento
router.get('/buscar/sacramento', validarJWT, validarPermiso('VER_PERSONAS'), buscarPersonasParaSacramento);

router.get('/', validarJWT, validarPermiso('VER_PERSONAS'), getPersonas);

router.get('/all', validarJWT, validarPermiso('VER_PERSONAS'), getAllPersonas);

router.get('/:id', validarJWT, validarPermiso('VER_PERSONAS'), getPersona);

router.put('/:id', validarJWT, validarPermiso('EDITAR_PERSONA'), [
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

router.patch('/:id', validarJWT, validarPermiso('DESACTIVAR_PERSONA'),[
    check('id', 'El ID debe ser un número válido').isInt(),
    validarCampos
], eliminarPersona);

module.exports = router;
