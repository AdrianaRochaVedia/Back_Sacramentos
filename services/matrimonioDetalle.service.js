const MatrimonioDetalle = require('../models/MatrimonioDetalle');

const crearOActualizarMatrimonioDetalle = async ({
  id_sacramento,
  matrimonioDetalle,
  transaction,
}) => {
  if (!matrimonioDetalle || typeof matrimonioDetalle !== 'object') {
    throw new Error('Datos de matrimonioDetalle no enviados o inválidos');
  }

  const existente = await MatrimonioDetalle.findOne({
    where: {
      sacramento_id_sacramento: id_sacramento,
    },
    transaction,
  });

  if (existente) {
    return existente.update(
      {
        lugar_ceremonia: matrimonioDetalle.lugar_ceremonia,
        reg_civil: matrimonioDetalle.reg_civil,
        numero_acta: matrimonioDetalle.numero_acta,
      },
      { transaction }
    );
  }

  return MatrimonioDetalle.create(
    {
      sacramento_id_sacramento: id_sacramento,
      lugar_ceremonia: matrimonioDetalle.lugar_ceremonia,
      reg_civil: matrimonioDetalle.reg_civil,
      numero_acta: matrimonioDetalle.numero_acta,
    },
    { transaction, returning: false }
  );
};

module.exports = {
  crearOActualizarMatrimonioDetalle,
};