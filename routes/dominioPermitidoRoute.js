const { Router } = require('express');
const { validarJWT } = require('../middlewares/validar-jwt');
const { validarPermiso } = require('../middlewares/validarPermiso');
const {
  getDominiosPermitidos,
  getDominioPermitidoById,
  createDominioPermitido,
  updateDominioPermitido,
  deleteDominioPermitido,
} = require('../controllers/dominioPermitido');

const router = Router();

router.get('/', validarJWT, validarPermiso('VER_CONFIG_SEGURIDAD'), getDominiosPermitidos);
router.get('/:id', validarJWT, validarPermiso('VER_CONFIG_SEGURIDAD'), getDominioPermitidoById);
router.post('/new', validarJWT, validarPermiso('CREAR_CONFIG_SEGURIDAD'), createDominioPermitido);
router.put('/:id', validarJWT, validarPermiso('EDITAR_CONFIG_SEGURIDAD'), updateDominioPermitido);
router.delete('/:id', validarJWT, validarPermiso('ELIMINAR_CONFIG_SEGURIDAD'), deleteDominioPermitido);

module.exports = router;