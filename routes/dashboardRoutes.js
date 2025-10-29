const express = require('express');
const router = express.Router();
const { validarJWT } = require('../middlewares/validar-jwt');
const { getDashboardStats } = require('../controllers/dashboard');

// GET /api/dashboard/stats?fechaInicio=2020-01-01&fechaFin=2024-12-31&sacramentos[]=Bautismo&sacramentos[]=Matrimonio
router.get('/stats', validarJWT, getDashboardStats);

module.exports = router;