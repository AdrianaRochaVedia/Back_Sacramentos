const PersonaSacramento = require('../models/PersonaSacramento');

const crearRelacionesSacramento = async ({
  id_sacramento,
  relaciones,
  transaction,
}) => {
  const relacionesCrear = relaciones.map((rel) => ({
    persona_id_persona: rel.persona_id,
    rol_sacramento_id_rol_sacra: rel.rol_sacramento_id,
    sacramento_id_sacramento: id_sacramento,
  }));

  return PersonaSacramento.bulkCreate(relacionesCrear, { transaction, returning: false });
};

const sincronizarRelacionesSacramento = async ({
  id_sacramento,
  relaciones,
  transaction,
}) => {
  await PersonaSacramento.destroy({
    where: { sacramento_id_sacramento: id_sacramento },
    transaction,
  });

  return crearRelacionesSacramento({
    id_sacramento,
    relaciones,
    transaction,
  });
};

module.exports = {
  crearRelacionesSacramento,
  sincronizarRelacionesSacramento,
};