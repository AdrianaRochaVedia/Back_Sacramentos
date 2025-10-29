// routes/personasacramento.js
const { Router } = require('express');
const { check } = require('express-validator');
const { validarCampos } = require('../middlewares/validar-campos');
const { 
    getPersonaSacramentos,
    crearPersonaSacramento,
    getPersonasPorSacramento,
    getSacramentosPorPersona
} = require('../controllers/personasacramento');
const { validarJWT } = require('../middlewares/validar-jwt');

const router = Router();

router.use(validarJWT);

router.get('/', getPersonaSacramentos);

router.get('/sacramento/:sacramentoId', getPersonasPorSacramento);

router.get('/persona/:personaId', getSacramentosPorPersona);


router.post('/new', [
    check('persona_id_persona', 'El ID de persona es obligatorio').not().isEmpty(),
    check('persona_id_persona', 'El ID de persona debe ser un número').isNumeric(),
    check('rol_sacramento_id_rol_sacra', 'El ID de rol sacramento es obligatorio').not().isEmpty(),
    check('rol_sacramento_id_rol_sacra', 'El ID de rol sacramento debe ser un número').isNumeric(),
    check('sacramento_id_sacramento', 'El ID de sacramento es obligatorio').not().isEmpty(),
    check('sacramento_id_sacramento', 'El ID de sacramento debe ser un número').isNumeric(),
    validarCampos
], crearPersonaSacramento);

module.exports = router;             