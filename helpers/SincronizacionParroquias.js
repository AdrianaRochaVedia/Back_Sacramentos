
const { Op } = require('sequelize');
const UsuarioParroquia = require('../models/UsuarioParroquia');

const sincronizarUsuarioParroquias = async ({
  id_usuario,
  id_parroquias = [],
  rol_en_parroquia = 'PARROCO',
}) => {
  const idsNuevos = id_parroquias.map(Number);

  await UsuarioParroquia.update(
    {
      activo: false,
      fecha_fin: new Date(),
    },
    {
      where: {
        id_usuario,
        rol_en_parroquia,
        activo: true,
        id_parroquia: {
          [Op.notIn]: idsNuevos.length ? idsNuevos : [0],
        },
      },
    }
  );

  for (const id_parroquia of idsNuevos) {
    const relacion = await UsuarioParroquia.findOne({
      where: {
        id_usuario,
        id_parroquia,
        rol_en_parroquia,
      },
    });

    if (relacion) {
      await relacion.update({
        activo: true,
        fecha_fin: null,
      });
    } else {
      await UsuarioParroquia.create({
        id_usuario,
        id_parroquia,
        rol_en_parroquia,
        activo: true,
      });
    }
  }
};

module.exports = { sincronizarUsuarioParroquias };