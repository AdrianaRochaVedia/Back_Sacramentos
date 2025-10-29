// controllers/busquedaGeneral.js
const { response } = require('express');
const { Op } = require('sequelize');
const Persona = require('../models/Persona');
const Sacramento = require('../models/Sacramento');
const TipoSacramento = require('../models/TipoSacramento');
const Parroquia = require('../models/Parroquia');
const RolSacramento = require('../models/RolSacramento');
const Usuario = require('../models/Usuario');

const busquedaGlobal = async (req, res) => {
  const { q } = req.query;

  if (!q || q.trim() === '') {
    return res.status(400).json({
      ok: false,
      msg: 'Debe proporcionar un término de búsqueda'
    });
  }

  try {
    const termino = q.trim().toLowerCase();
    const resultados = {};

    // Buscar en Personas
    const personas = await Persona.findAll({
      where: {
        [Op.or]: [
          { nombre: { [Op.iLike]: `%${termino}%` } },
          { apellido_paterno: { [Op.iLike]: `%${termino}%` } },
          { apellido_materno: { [Op.iLike]: `%${termino}%` } },
          { carnet_identidad: { [Op.iLike]: `%${termino}%` } },
          { lugar_nacimiento: { [Op.iLike]: `%${termino}%` } }
        ]
      },
      limit: 5,
      attributes: ['id_persona', 'nombre', 'apellido_paterno', 'apellido_materno', 'carnet_identidad']
    });
    if (personas.length > 0) resultados.personas = personas;

    // Buscar en Sacramentos
    const sacramentos = await Sacramento.findAll({
      where: {
        [Op.or]: [
          { foja: { [Op.iLike]: `%${termino}%` } },
          { numero: isNaN(termino) ? 0 : parseInt(termino) }
        ]
      },
      include: [
        { model: TipoSacramento, as: 'tipoSacramento', attributes: ['nombre'] },
        { model: Parroquia, as: 'parroquia', attributes: ['nombre'] }
      ],
      limit: 5
    });
    if (sacramentos.length > 0) resultados.sacramentos = sacramentos;

    // Buscar en Parroquias
    const parroquias = await Parroquia.findAll({
      where: {
        [Op.or]: [
          { nombre: { [Op.iLike]: `%${termino}%` } },
          { direccion: { [Op.iLike]: `%${termino}%` } },
          { email: { [Op.iLike]: `%${termino}%` } }
        ]
      },
      limit: 5
    });
    if (parroquias.length > 0) resultados.parroquias = parroquias;

    // Buscar en Tipos de Sacramento
    const tiposSacramento = await TipoSacramento.findAll({
      where: {
        [Op.or]: [
          { nombre: { [Op.iLike]: `%${termino}%` } },
          { descripcion: { [Op.iLike]: `%${termino}%` } }
        ]
      },
      limit: 5
    });
    if (tiposSacramento.length > 0) resultados.tipos_sacramento = tiposSacramento;

    // Buscar en Roles de Sacramento
    const roles = await RolSacramento.findAll({
      where: {
        nombre: { [Op.iLike]: `%${termino}%` }
      },
      limit: 5
    });
    if (roles.length > 0) resultados.roles_sacramento = roles;

    // Buscar en Usuarios
    const usuarios = await Usuario.findAll({
      where: {
        [Op.or]: [
          { nombre: { [Op.iLike]: `%${termino}%` } },
          { apellido_paterno: { [Op.iLike]: `%${termino}%` } },
          { apellido_materno: { [Op.iLike]: `%${termino}%` } },
          { email: { [Op.iLike]: `%${termino}%` } }
        ]
      },
      limit: 5,
      attributes: ['id_usuario', 'nombre', 'apellido_paterno', 'apellido_materno', 'email', 'rol']
    });
    if (usuarios.length > 0) resultados.usuarios = usuarios;

    const totalResultados = Object.values(resultados).reduce((acc, arr) => acc + arr.length, 0);

    res.json({
      ok: true,
      termino_busqueda: q,
      resultados,
      total_resultados: totalResultados
    });

  } catch (error) {
    console.error('Error en búsqueda global:', error);
    res.status(500).json({
      ok: false,
      msg: 'Error al realizar la búsqueda'
    });
  }
};

module.exports = {
  busquedaGlobal
};