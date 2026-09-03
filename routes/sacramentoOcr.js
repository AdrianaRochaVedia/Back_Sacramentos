const { Router } = require('express');
const { check } = require('express-validator');
const { validarCampos } = require('../middlewares/validar-campos');
const { validarJWT } = require('../middlewares/validar-jwt');
const { validarPermiso } = require('../middlewares/validarPermiso');
const { procesarOCR, confirmarOCR, getHistoricoOCR, rechazarOCR, confirmarParroquiaOCR, crearYConfirmarParroquiaOCR } = require('../controllers/sacramentoOcr');
const multer = require('multer');

const TIPOS_IMAGEN_PERMITIDOS = ['image/jpeg', 'image/png', 'image/webp'];
const TAMANO_MAXIMO_BYTES = 10 * 1024 * 1024; // 10 MB

const upload = multer({
    dest: 'uploads/',
    limits: { fileSize: TAMANO_MAXIMO_BYTES },
    fileFilter: (req, file, cb) => {
        if (!TIPOS_IMAGEN_PERMITIDOS.includes(file.mimetype)) {
            return cb(new Error('FORMATO_NO_SOPORTADO'));
        }
        cb(null, true);
    }
});

// Envuelve multer para devolver un JSON claro en vez de dejar que el error
// llegue crudo al manejador de errores genérico de Express.
const subirImagenOcr = (req, res, next) => {
    upload.single('imagen')(req, res, (err) => {
        if (!err) return next();

        if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({
                ok: false,
                msg: 'La imagen supera el tamaño máximo permitido (10 MB).'
            });
        }

        if (err.message === 'FORMATO_NO_SOPORTADO') {
            return res.status(400).json({
                ok: false,
                msg: 'Formato de archivo no soportado. Usa una imagen JPG, PNG o WEBP.'
            });
        }

        return res.status(400).json({
            ok: false,
            msg: 'No se pudo procesar el archivo subido.'
        });
    });
};

const router = Router();

router.post(
    '/preview',
    validarJWT,
    validarPermiso('REGISTRAR_OCR'),
    subirImagenOcr,
    [
        check('tipo_sacramento_id', 'El tipo de sacramento es obligatorio').isInt(),
        check('institucion_parroquia_id').optional().isInt(),
        validarCampos
    ],
    procesarOCR
);

router.post(
    '/confirmar',
    validarJWT,
    validarPermiso('REGISTRAR_OCR'),
    [
        check('historico_id', 'El historico_id es obligatorio').isInt(),
        check('fecha_sacramento', 'La fecha del sacramento es obligatoria').notEmpty(),
        check('foja', 'La foja es obligatoria').not().isEmpty(),
        check('numero', 'El número es obligatorio').isInt(),
        check('relaciones').optional().isArray().withMessage('relaciones debe ser un array'),
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
    rechazarOCR
);

router.put(
    '/parroquia/:id',
    validarJWT,
    validarPermiso('EDITAR_SACRAMENTO'),
    confirmarParroquiaOCR
);

router.post(
    '/parroquia/crear/:id',
    validarJWT,
    validarPermiso('EDITAR_SACRAMENTO'),
    [
        check('nombre_parroquia', 'El nombre de la parroquia es obligatorio').not().isEmpty(),
        check('direccion').optional().not().isEmpty(),
        check('telefono').optional().not().isEmpty(),
        check('email').optional().isEmail(),
        validarCampos
    ],
    crearYConfirmarParroquiaOCR
);

module.exports = router;