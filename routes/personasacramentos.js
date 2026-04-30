// routes/personasacramento.js
const { Router } = require('express');
const { check } = require('express-validator');
const { validarCampos } = require('../middlewares/validar-campos');
const { 
    getPersonaSacramentos,
    crearPersonaSacramento,
    getPersonasPorSacramento,
    getSacramentosPorPersona,
    validarBautizoPersona
} = require('../controllers/personasacramento');
const { validarJWT } = require('../middlewares/validar-jwt');
const { validarPermiso } = require('../middlewares/validarPermiso');

const router = Router();

router.use(validarJWT);

router.get('/', validarJWT,validarPermiso('VER_SACRAMENTOS'),getPersonaSacramentos);

router.get('/sacramento/:sacramentoId', validarJWT, validarPermiso('VER_SACRAMENTOS'), getPersonasPorSacramento);

router.get('/persona/:personaId', validarJWT, validarPermiso('VER_SACRAMENTOS'), getSacramentosPorPersona);


router.post('/new', 
    validarJWT,
    validarPermiso('CREAR_SACRAMENTO'),
    [
    check('persona_id_persona', 'El ID de persona es obligatorio').not().isEmpty(),
    check('persona_id_persona', 'El ID de persona debe ser un número').isNumeric(),
    check('rol_sacramento_id_rol_sacra', 'El ID de rol sacramento es obligatorio').not().isEmpty(),
    check('rol_sacramento_id_rol_sacra', 'El ID de rol sacramento debe ser un número').isNumeric(),
    check('sacramento_id_sacramento', 'El ID de sacramento es obligatorio').not().isEmpty(),
    check('sacramento_id_sacramento', 'El ID de sacramento debe ser un número').isNumeric(),
    validarCampos
], crearPersonaSacramento);

//ruta para validar bautizo
router.get('/validar-bautizo/:personaId', validarJWT, validarPermiso('VER_SACRAMENTOS'), validarBautizoPersona);

module.exports = router;             