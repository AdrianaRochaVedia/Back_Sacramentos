const { Router } = require('express');
const { validarJWT }    = require('../middlewares/validar-jwt');
const { validarPermiso } = require('../middlewares/validarPermiso');
const {
  getActivos,
  getActivoById,
  createActivo,
  updateActivo,
  deleteActivo,
} = require('../controllers/activosInformacion');

const router = Router();

router.get('/',       validarJWT, validarPermiso('VER_ACTIVOS_INFORMACION'),      getActivos);
router.get('/:id',    validarJWT, validarPermiso('VER_ACTIVOS_INFORMACION'),      getActivoById);
router.post('/',      validarJWT, validarPermiso('CREAR_ACTIVOS_INFORMACION'),    createActivo);
router.put('/:id',    validarJWT, validarPermiso('EDITAR_ACTIVOS_INFORMACION'),   updateActivo);
router.delete('/:id', validarJWT, validarPermiso('ELIMINAR_ACTIVOS_INFORMACION'), deleteActivo);

module.exports = router;
