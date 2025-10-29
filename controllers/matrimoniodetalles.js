const { response } = require('express');
const MatrimonioDetalle = require('../models/MatrimonioDetalle');

// Obtener todos los tipos de sacramento activos
const getMatrimonioDetalles = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const offset = (page - 1) * limit;
        const { count, rows } = await MatrimonioDetalle.findAndCountAll({
            offset,
            limit
        });

        res.json({
            ok: true,
            matrimonio_detalle: rows,
            totalItems: count,
            totalPages: Math.ceil(count / limit),
            currentPage: page
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            ok: false,
            msg: 'Error al obtener los detalles de matrimonio'
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


const crearMatrimonioDetalle = async (req, res) => {
  const { sacramento_id_sacramento, reg_civil, lugar_ceremonia, numero_acta } = req.body;

  try {
    const existe = await MatrimonioDetalle.findOne({ where: { sacramento_id_sacramento } });
    if (existe) {
      return res.status(400).json({ ok: false, msg: 'El detalle de matrimonio ya está registrado' });
    }

    const matrimonioDetalle = await MatrimonioDetalle.create({
      sacramento_id_sacramento,
      reg_civil,
      lugar_ceremonia,
      numero_acta
    });
    res.status(201).json({
      ok: true,
      matrimonioDetalle
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, msg: 'Hable con el administrador' });
  }
};


// Obtener un detalle de matrimonio por ID
const getMatrimonioDetalle = async (req, res) => {
    const { id } = req.params;
    try {
      const matrimonioDetalle = await MatrimonioDetalle.findOne({
        where: { sacramento_id_sacramento: id }
      });
      if (!matrimonioDetalle) {
        return res.status(404).json({ ok: false, msg: 'Detalle de matrimonio no encontrado' });
      }
      res.json({ ok: true, matrimonioDetalle });
    } catch (err) {
      console.error(err);
      res.status(500).json({ ok: false, msg: 'Error al obtener detalle de matrimonio' });
    }
  };

//Funcion para editar a la persona
const actualizarMatrimonioDetalle = async (req, res = response) => {
    const { id } = req.params;
    const { sacramento_id_sacramento, reg_civil, lugar_ceremonia, numero_acta } = req.body;

    try {
        const matrimonioDetalle = await MatrimonioDetalle.findOne({
            where: { sacramento_id_sacramento: id }
        });

        if (!matrimonioDetalle) {
            return res.status(404).json({
                ok: false,
                msg: 'Detalle de matrimonio no encontrado'
            });
        }
        
        const updates = {};
        if (sacramento_id_sacramento !== undefined) updates.sacramento_id_sacramento = sacramento_id_sacramento;
        if (reg_civil !== undefined) updates.reg_civil = reg_civil;
        if (lugar_ceremonia !== undefined) updates.lugar_ceremonia = lugar_ceremonia;
        if (numero_acta !== undefined) updates.numero_acta = numero_acta;

        await matrimonioDetalle.update(updates);
        return res.json({
            ok: true,
            matrimonioDetalle: matrimonioDetalle.get({ plain: true })
        });

    } catch (e) {
      console.error('Error al actualizar el detalle de matrimonio:', e);
      res.status(500).json({ ok:false, msg:'Error al actualizar el detalle de matrimonio' });
    }
};


  module.exports = {
    getMatrimonioDetalles,
    crearMatrimonioDetalle,
    getMatrimonioDetalle,
    actualizarMatrimonioDetalle,
  };