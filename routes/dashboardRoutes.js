const { Router } = require('express');
const { getDashboardSummary } = require('../controllers/dashboard');
const { validarJWT } = require('../middlewares/validar-jwt');
const { validarPermiso } = require('../middlewares/validarPermiso');

const router = Router();

// Endpoint compacto con todo lo que pide el front
router.get('/summary', validarJWT, validarPermiso('VER_AUDITORIA'), getDashboardSummary);

module.exports = router;