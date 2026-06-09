const { Router } = require('express');
const { enviarMensaje } = require('../controllers/chatbot');
const { validarJWT } = require('../middlewares/validar-jwt');
const { validarPermiso } = require('../middlewares/validarPermiso');

const router = Router();

/**
 * POST /api/chatbot/mensaje
 * Body: { mensaje: string, historial: Array<{ role: 'user'|'model', content: string }> }
 */
router.post(
  '/mensaje',
  validarJWT,
  validarPermiso('VER_SACRAMENTOS'),
  enviarMensaje
);

module.exports = router;