const { Router } = require('express');
const { check } = require('express-validator');
const { validarCampos } = require('../middlewares/validar-campos');
const { crearMatrimonioDetalle, getMatrimonioDetalle, getMatrimonioDetalles, actualizarMatrimonioDetalle } = require('../controllers/matrimoniodetalles');
const { validarJWT } = require('../middlewares/validar-jwt');
const { validarPermiso } = require('../middlewares/validarPermiso');

const router = Router();

router.post(
    '/new',
     validarJWT,
     validarPermiso('CREAR_SACRAMENTO'),
    [
        check('sacramento_id_sacramento', 'El ID del sacramento es obligatorio').isInt(),
        check('reg_civil', 'El registro civil es obligatorio').not().isEmpty(),
        check('lugar_ceremonia', 'El lugar de la ceremonia es obligatorio').not().isEmpty(),
        check('numero_acta', 'El número de acta es obligatorio').not().isEmpty(),

        validarCampos
    ],
    crearMatrimonioDetalle
);

router.get('/', validarJWT, validarPermiso('VER_SACRAMENTOS'), getMatrimonioDetalles);

router.get('/:id', validarJWT, validarPermiso('VER_SACRAMENTOS'), getMatrimonioDetalle);

router.put('/:id', validarJWT, validarPermiso('EDITAR_SACRAMENTO'),[
    check('sacramento_id_sacramento', 'El ID del sacramento es obligatorio').isInt(),
    check('reg_civil', 'El registro civil es obligatorio').not().isEmpty(),
    check('lugar_ceremonia', 'El lugar de la ceremonia es obligatorio').not().isEmpty(),
    check('numero_acta', 'El número de acta es obligatorio').not().isEmpty(),
        
], actualizarMatrimonioDetalle);


module.exports = router;
