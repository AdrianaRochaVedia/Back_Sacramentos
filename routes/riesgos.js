const { Router } = require('express');
const { validarJWT } = require('../middlewares/validar-jwt');
const {
  getRiesgos,
  getRiesgoById,
  createRiesgo,
  updateRiesgo,
  deleteRiesgo,
} = require('../controllers/riesgos');
 
const router = Router();
 
router.get('/',      validarJWT, getRiesgos);
router.get('/:id',   validarJWT, getRiesgoById);
router.post('/',     validarJWT, createRiesgo);
router.put('/:id',   validarJWT, updateRiesgo);
router.delete('/:id',validarJWT, deleteRiesgo);
 
module.exports = router;