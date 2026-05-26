const Sacramento = require('../models/Sacramento');

const { validarRelaciones, validarFechasSacramento } = require('../helpers/sacramentoValidations');
const {
  crearRelacionesSacramento,
  sincronizarRelacionesSacramento,
} = require('./personaSacramento.service');
const {
  crearOActualizarMatrimonioDetalle,
} = require('./matrimonioDetalle.service');

const ID_MATRIMONIO = 2;

const crearSacramentoCompletoService = async ({
  data,
  usuario_id_usuario,
  transaction,
}) => {
  const {
    fecha_sacramento,
    foja,
    numero,
    tipo_sacramento_id_tipo,
    parroquiaId,
    relaciones,
    matrimonioDetalle,
  } = data;

  // Validaciones de formato
  validarRelaciones(relaciones);

  // Validaciones de lógica y fechas (asíncrona — consulta la BD)
  await validarFechasSacramento({ tipo_sacramento_id_tipo, fecha_sacramento, relaciones });

  const sacramento = await Sacramento.create(
    {
      fecha_sacramento,
      foja,
      numero,
      tipo_sacramento_id_tipo,
      institucion_parroquia_id_parroquia: parroquiaId,
      usuario_id_usuario,
      activo: true,
      fecha_registro: new Date(),
      fecha_actualizacion: new Date(),
    },
    { transaction }
  );

  if (Number(tipo_sacramento_id_tipo) === ID_MATRIMONIO) {
    await crearOActualizarMatrimonioDetalle({
      id_sacramento: sacramento.id_sacramento,
      matrimonioDetalle,
      transaction,
    });
  }

  await crearRelacionesSacramento({
    id_sacramento: sacramento.id_sacramento,
    relaciones,
    transaction,
  });

  return sacramento;
};

const actualizarSacramentoCompletoService = async ({
  id_sacramento,
  data,
  usuario_id_usuario,
  transaction,
}) => {
  let {
    fecha_sacramento,
    foja,
    numero,
    tipo_sacramento_id_tipo,
    parroquiaId,
    relaciones,
    matrimonioDetalle,
  } = data;

  if (typeof relaciones === 'string') {
    relaciones = JSON.parse(relaciones);
  }

  // Validaciones de formato
  validarRelaciones(relaciones);

  // Validaciones de lógica y fechas
  await validarFechasSacramento({ tipo_sacramento_id_tipo, fecha_sacramento, relaciones });

  const sacramento = await Sacramento.findOne({
    where: { id_sacramento, activo: true },
    transaction,
  });

  if (!sacramento) {
    throw new Error('Sacramento no encontrado');
  }

  await sacramento.update(
    {
      fecha_sacramento,
      foja,
      numero,
      tipo_sacramento_id_tipo,
      institucion_parroquia_id_parroquia: parroquiaId,
      usuario_id_usuario,
      fecha_actualizacion: new Date(),
    },
    { transaction }
  );

  if (Number(tipo_sacramento_id_tipo) === ID_MATRIMONIO) {
    await crearOActualizarMatrimonioDetalle({
      id_sacramento,
      matrimonioDetalle,
      transaction,
    });
  }

  await sincronizarRelacionesSacramento({
    id_sacramento,
    relaciones,
    transaction,
  });

  return sacramento;
};

module.exports = {
  crearSacramentoCompletoService,
  actualizarSacramentoCompletoService,
};