const { Router } = require('express');
const { getDashboardSummary } = require('../controllers/dashboard');

const router = Router();

// Endpoint compacto con todo lo que pide el front
router.get('/summary', getDashboardSummary);

module.exports = router;