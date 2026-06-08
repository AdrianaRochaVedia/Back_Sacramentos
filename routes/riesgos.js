const { Router } = require('express');
const { validarJWT }    = require('../middlewares/validar-jwt');
const { validarPermiso } = require('../middlewares/validarPermiso');
const {
  getRiesgos,
  getRiesgoById,
  createRiesgo,
  updateRiesgo,
  publicarRiesgo,
  deleteRiesgo,
} = require('../controllers/riesgos');
const {
  getControles,
  createControl,
  updateControl,
  deleteControl,
} = require('../controllers/controles');

const router = Router();

// ── Riesgos ───────────────────────────────────────────────────────────────────
router.get('/',       validarJWT, validarPermiso('VER_MATRIZ_RIESGOS'),      getRiesgos);
router.get('/:id',    validarJWT, validarPermiso('VER_MATRIZ_RIESGOS'),      getRiesgoById);
router.post('/',      validarJWT, validarPermiso('CREAR_MATRIZ_RIESGOS'),    createRiesgo);
router.put('/:id',    validarJWT, validarPermiso('EDITAR_MATRIZ_RIESGOS'),   updateRiesgo);
router.put('/:id/publicar', validarJWT, validarPermiso('EDITAR_MATRIZ_RIESGOS'), publicarRiesgo);
router.delete('/:id', validarJWT, validarPermiso('ELIMINAR_MATRIZ_RIESGOS'), deleteRiesgo);

// ── Controles (anidados bajo riesgos/:id/controles) ───────────────────────────
router.get('/:id/controles',               validarJWT, validarPermiso('VER_MATRIZ_RIESGOS'),      getControles);
router.post('/:id/controles',              validarJWT, validarPermiso('EDITAR_MATRIZ_RIESGOS'),   createControl);
router.put('/:id/controles/:id_control',   validarJWT, validarPermiso('EDITAR_MATRIZ_RIESGOS'),   updateControl);
router.delete('/:id/controles/:id_control',validarJWT, validarPermiso('ELIMINAR_MATRIZ_RIESGOS'), deleteControl);

module.exports = router;
