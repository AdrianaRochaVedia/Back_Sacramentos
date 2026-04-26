const { Router } = require('express');
const { check } = require('express-validator');
const { validarCampos } = require('../middlewares/validar-campos');
const { getAllSacramentos, crearSacramento, getSacramento, getSacramentos, actualizarSacramento, eliminarSacramento, crearSacramentoCompleto, buscarSacramentosPorPersona, getSacramentoCompleto, actualizarSacramentoCompleto, buscarPersonasConTodosLosSacramentos  } = require('../controllers/sacramentos');
const { validarJWT } = require('../middlewares/validar-jwt');

const router = Router();

router.post(
    '/new',
     validarJWT,
    [
        check('fecha_sacramento', 'La fecha del sacramento es obligatoria').isDate(),
        check('foja', 'La foja es obligatoria').not().isEmpty(),
        check('numero', 'El número es obligatorio').not().isEmpty(),
        validarCampos
    ],
    crearSacramento
);

router.get('/', validarJWT,getSacramentos);

router.get('/all', validarJWT, getAllSacramentos);

router.get('/buscar-persona', 
    validarJWT,
    buscarSacramentosPorPersona
);

// 
router.get('/buscar-sacerdotes/todos-sacramentos',
    validarJWT,
    buscarPersonasConTodosLosSacramentos
);

router.get('/completo/:id',
     validarJWT, 
     getSacramentoCompleto);
router.put(
  '/completo/:id',
  validarJWT,
    validarCampos,
  actualizarSacramentoCompleto
);

router.get('/:id', validarJWT, getSacramento);

router.put('/:id', validarJWT, [
    validarCampos
], actualizarSacramento);

router.patch('/:id', validarJWT, [
    check('id', 'El ID debe ser un número válido').isInt(),
    validarCampos
], eliminarSacramento);

router.post(
    '/new-completo',
    validarJWT,
    crearSacramentoCompleto
);



module.exports = router;
