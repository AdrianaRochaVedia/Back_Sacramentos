const { Router } = require('express');
const { validarJWT }    = require('../middlewares/validar-jwt');
const { validarPermiso } = require('../middlewares/validarPermiso');
const {
  getVulnerabilidades,
  getVulnerabilidadById,
  createVulnerabilidad,
  updateVulnerabilidad,
  deleteVulnerabilidad,
} = require('../controllers/vulnerabilidades');

const router = Router();

router.get('/',       validarJWT, validarPermiso('VER_VULNERABILIDADES'),      getVulnerabilidades);
router.get('/:id',    validarJWT, validarPermiso('VER_VULNERABILIDADES'),      getVulnerabilidadById);
router.post('/',      validarJWT, validarPermiso('CREAR_VULNERABILIDADES'),    createVulnerabilidad);
router.put('/:id',    validarJWT, validarPermiso('EDITAR_VULNERABILIDADES'),   updateVulnerabilidad);
router.delete('/:id', validarJWT, validarPermiso('ELIMINAR_VULNERABILIDADES'), deleteVulnerabilidad);

module.exports = router;
