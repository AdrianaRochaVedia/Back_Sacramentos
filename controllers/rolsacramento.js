const { response } = require('express');
const RolSacramento = require('../models/RolSacramento');

// Obtener todos los tipos de sacramento activos
const getRolesSacramento = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const offset = (page - 1) * limit;
        const { count, rows } = await RolSacramento.findAndCountAll({
            offset,
            limit
        });

        res.json({
            ok: true,
            rol_sacramento: rows,
            totalItems: count,
            totalPages: Math.ceil(count / limit),
            currentPage: page
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            ok: false,
            msg: 'Error al obtener el rol del sacramento'
        });
    }
};

// Obtener todos las parroquias
// const getAllParroquias = async (req, res) => {
//     try {
//         const page = parseInt(req.query.page) || 1;
//         const limit = parseInt(req.query.limit) || 10;
//         const offset = (page - 1) * limit;
//         const { count, rows } = await Parroquias.findAndCountAll({
//             offset,
//             limit
//         });

//         res.json({
//             ok: true,
//             tipo_sacramento: rows,
//             totalItems: count,
//             totalPages: Math.ceil(count / limit),
//             currentPage: page
//         });
//     } catch (error) {
//         console.error(error);
//         res.status(500).json({
//             ok: false,
//             msg: 'Error al obtener todos los tipos de sacramento'
//         });
//     }
// };


const crearRolSacramento = async (req, res) => {
  const { nombre } = req.body;

  try {
    const existe = await RolSacramento.findOne({ where: { nombre } });
    if (existe) {
      return res.status(400).json({ ok: false, msg: 'El rol del sacramento ya está registrado' });
    }

    const rolSacramento = await RolSacramento.create({
      nombre
    });

    res.status(201).json({
      ok: true,
      rol_sacramento: {
        id_rol_sacra: rolSacramento.id_rol_sacra,
        nombre: rolSacramento.nombre
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, msg: 'Hable con el administrador' });
  }
};

const getRolSacramento = async (req, res) => {
  const { id } = req.params;
  try {
    const rolSacramento = await RolSacramento.findOne({
      where: { id_rol_sacra: id }
    });
    if (!rolSacramento) {
      return res.status(404).json({ ok: false, msg: 'Rol del sacramento no encontrado' });
    }
    res.json({ ok: true, rol_sacramento: rolSacramento });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, msg: 'Error al obtener rol del sacramento' });
  }
};

//Funcion para editar a la persona
const actualizarRolSacramento = async (req, res = response) => {
  const { id } = req.params;
  const { nombre } = req.body;

  try {
    const rolSacramento = await RolSacramento.findOne({
      where: { id_rol_sacra: id }
    });

    if (!rolSacramento) {
      return res.status(404).json({
        ok: false,
        msg: 'Rol del sacramento no encontrado'
      });
    }

    const updates = {};
    if (nombre !== undefined) updates.nombre = nombre;

    await rolSacramento.update(updates);
    return res.json({
      ok: true,
      rol_sacramento: rolSacramento.get({ plain: true })
    });

  } catch (e) {
    console.error('Error al actualizar el rol del sacramento:', e);
    res.status(500).json({ ok: false, msg: 'Error al actualizar el rol del sacramento' });
  }
};


  module.exports = {
    getRolesSacramento,
    crearRolSacramento,
    getRolSacramento,
    actualizarRolSacramento,
  };




