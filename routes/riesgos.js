const { Router } = require('express');
const { validarJWT } = require('../middlewares/validar-jwt');
const { validarPermiso } = require('../middlewares/validarPermiso');
const {
  getRiesgos,
  getRiesgoById,
  createRiesgo,
  updateRiesgo,
  deleteRiesgo,
} = require('../controllers/riesgos');

const router = Router();

router.get('/',       validarJWT, validarPermiso('VER_MATRIZ_RIESGOS'),    getRiesgos);
router.get('/:id',    validarJWT, validarPermiso('VER_MATRIZ_RIESGOS'),    getRiesgoById);
router.post('/',      validarJWT, validarPermiso('CREAR_MATRIZ_RIESGOS'),  createRiesgo);
router.put('/:id',    validarJWT, validarPermiso('EDITAR_MATRIZ_RIESGOS'), updateRiesgo);
router.delete('/:id', validarJWT, validarPermiso('ELIMINAR_MATRIZ_RIESGOS'), deleteRiesgo);
 
module.exports = router;