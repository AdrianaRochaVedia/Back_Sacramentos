const { Router } = require('express');
const { check } = require('express-validator');
const { validarCampos } = require('../middlewares/validar-campos');
const { getConfiguracion, actualizarConfiguracion } = require('../controllers/configuracionSeguridad');
const { validarJWT } = require('../middlewares/validar-jwt');

const router = Router();

router.get('/', validarJWT, getConfiguracion);

router.put('/', validarJWT, [
    check('longitud_minima').optional().isInt({ min: 1 }).withMessage('Debe ser un número entero positivo'),
    check('longitud_maxima').optional().isInt({ min: 1 }).withMessage('Debe ser un número entero positivo'),
    check('max_intentos_fallidos').optional().isInt({ min: 1 }).withMessage('Debe ser un número entero positivo'),
    check('tiempo_bloqueo_minutos').optional().isInt({ min: 1 }).withMessage('Debe ser un número entero positivo'),
    check('historial_passwords').optional().isInt({ min: 0 }).withMessage('Debe ser un número entero positivo'),
    check('vida_util_password_dias').optional().isInt({ min: 1 }).withMessage('Debe ser un número entero positivo'),
    check('requiere_mayuscula').optional().isBoolean(),
    check('requiere_minuscula').optional().isBoolean(),
    check('requiere_numero').optional().isBoolean(),
    check('requiere_caracter_especial').optional().isBoolean(),
    check('permite_reutilizacion').optional().isBoolean(),
    check('usa_2fa').optional().isBoolean(),
    check('usa_captcha').optional().isBoolean(),
    validarCampos
], actualizarConfiguracion);

module.exports = router;