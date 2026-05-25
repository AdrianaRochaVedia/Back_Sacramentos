const { Router } = require('express');
const { validarJWT } = require('../middlewares/validar-jwt');
const { validarPermiso } = require('../middlewares/validarPermiso');
const { validarCampos } = require('../middlewares/validar-campos');

const {
  getAsignaciones,
  getAsignacionById,
  crearAsignacion,
  actualizarAsignacion,
  desactivarAsignacion,
} = require('../controllers/usuarioParroquia');

const router = Router();

router.get('/', validarJWT, validarPermiso('VER_PARROQUIAS'), getAsignaciones);
router.get('/:id', validarJWT, validarPermiso('VER_PARROQUIAS'), getAsignacionById);
router.post('/new', validarJWT, validarPermiso('CREAR_PARROQUIA'), validarCampos, crearAsignacion);
router.put('/:id', validarJWT, validarPermiso('EDITAR_PARROQUIA'), validarCampos, actualizarAsignacion);
router.delete('/:id', validarJWT, validarPermiso('ELIMINAR_PARROQUIA'), desactivarAsignacion);

module.exports = router;