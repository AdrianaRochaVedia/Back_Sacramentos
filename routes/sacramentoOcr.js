const { Router } = require('express');
const { check } = require('express-validator');
const { validarCampos } = require('../middlewares/validar-campos');
const { validarJWT } = require('../middlewares/validar-jwt');
const { validarPermiso } = require('../middlewares/validarPermiso');
const { procesarOCR, confirmarOCR, getHistoricoOCR, rechazarOCR } = require('../controllers/sacramentoOcr');
const multer = require('multer');

const upload = multer({ dest: 'uploads/' });

const router = Router();

router.post(
    '/preview',
    validarJWT,
    validarPermiso('CREAR_SACRAMENTO'),
    upload.single('imagen'),
    [
        check('tipo_sacramento_id', 'El tipo de sacramento es obligatorio').isInt(),
        check('institucion_parroquia_id', 'La parroquia es obligatoria').isInt(),
        validarCampos
    ],
    procesarOCR
);

router.post(
    '/confirmar',
    validarJWT,
    validarPermiso('CREAR_SACRAMENTO'),
    [
        check('historico_id', 'El historico_id es obligatorio').isInt(),
        check('fecha_sacramento', 'La fecha del sacramento es obligatoria').isDate(),
        check('foja', 'La foja es obligatoria').not().isEmpty(),
        check('numero', 'El número es obligatorio').isInt(),
        check('relaciones', 'Las relaciones son obligatorias').isArray({ min: 1 }),
        validarCampos
    ],
    confirmarOCR
);

router.get(
    '/historico',
    validarJWT,
    validarPermiso('VER_SACRAMENTOS'),
    getHistoricoOCR
);

router.put(
    '/rechazar/:id',
    validarJWT,
    validarPermiso('EDITAR_SACRAMENTO'),
    [
        check('id', 'El ID debe ser un número válido').isInt(),
        validarCampos
    ],
    rechazarOCR
);

module.exports = router;