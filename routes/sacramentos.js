const { Router } = require('express');
const { check } = require('express-validator');
const { validarCampos } = require('../middlewares/validar-campos');
const { getAllSacramentos, crearSacramento, getSacramento, getSacramentos, actualizarSacramento, eliminarSacramento, crearSacramentoCompleto, buscarSacramentosPorPersona, getSacramentoCompleto, actualizarSacramentoCompleto, buscarPersonasConTodosLosSacramentos  } = require('../controllers/sacramentos');
const { validarJWT } = require('../middlewares/validar-jwt');
const { validarPermiso } = require('../middlewares/validarPermiso');

const router = Router();

router.post(
    '/new',
     validarJWT,
     validarPermiso('CREAR_SACRAMENTO'),
    [
        check('fecha_sacramento', 'La fecha del sacramento es obligatoria').isDate(),
        check('foja', 'La foja es obligatoria').not().isEmpty(),
        check('numero', 'El número es obligatorio').not().isEmpty(),
        validarCampos
    ],
    crearSacramento
);

router.get('/', validarJWT, validarPermiso('VER_SACRAMENTOS'), getSacramentos);

router.get('/all', validarJWT, validarPermiso('VER_SACRAMENTOS'), getAllSacramentos);

router.get('/buscar-persona', 
    validarJWT,
    validarPermiso('VER_SACRAMENTOS'),
    buscarSacramentosPorPersona
);

// 
router.get('/buscar-sacerdotes/todos-sacramentos',
    validarJWT,
    validarPermiso('VER_SACRAMENTOS'),
    buscarPersonasConTodosLosSacramentos
);

router.get('/completo/:id',
     validarJWT, 
     validarPermiso('VER_SACRAMENTOS'),
     getSacramentoCompleto);
router.put(
  '/completo/:id',
  validarJWT,
  validarPermiso('EDITAR_SACRAMENTO'),
    validarCampos,
  actualizarSacramentoCompleto
);

router.get('/:id', validarJWT,validarPermiso('VER_SACRAMENTOS'), getSacramento);

router.put('/:id', validarJWT, validarPermiso('EDITAR_SACRAMENTO'), [
    validarCampos
], actualizarSacramento);

router.patch('/:id', validarJWT, validarPermiso('EDITAR_SACRAMENTO'), [
    check('id', 'El ID debe ser un número válido').isInt(),
    validarCampos
], eliminarSacramento);

router.post(
    '/new-completo',
    validarJWT,
    validarPermiso('CREAR_SACRAMENTO'),
    crearSacramentoCompleto
);



module.exports = router;
