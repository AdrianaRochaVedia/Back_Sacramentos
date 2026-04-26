const { Router } = require('express');
const { getDashboardSummary } = require('../controllers/dashboard');
const { validarJWT } = require('../middlewares/validar-jwt');


const router = Router();

// Endpoint compacto con todo lo que pide el front
router.get('/summary', validarJWT,getDashboardSummary);

module.exports = router;