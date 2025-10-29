// routes/passwordRoutes.js
const { Router } = require('express');
const ctrl = require('../controllers/passwordController');

const router = Router();

// 1) El front solo manda el email
router.post('/solicitar', ctrl.solicitar);

// 2) El front valida el token al entrar desde el link del correo
router.get('/validar', ctrl.validar);

// 3) El front envía token + nueva contraseña
router.post('/cambiar', ctrl.cambiar);

module.exports = router;