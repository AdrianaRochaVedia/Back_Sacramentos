const { response } = require('express');
const Sacramento = require('../models/Sacramento');

// Obtener todos los sacramentos activos
const getSacramentos = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const offset = (page - 1) * limit;
        const { count, rows } = await Sacramento.findAndCountAll({
            where: { activo: true },
            offset,
            limit
        });

        res.json({
            ok: true,
            sacramento: rows,
            totalItems: count,
            totalPages: Math.ceil(count / limit),
            currentPage: page
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            ok: false,
            msg: 'Error al obtener los sacramentos'
        });
    }
};

// Obtener todos los sacramentos (incluidos los eliminados)
const getAllSacramentos = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const offset = (page - 1) * limit;
        const { count, rows } = await Sacramento.findAndCountAll({
            offset,
            limit
        });

        res.json({
            ok: true,
            sacramento: rows,
            totalItems: count,
            totalPages: Math.ceil(count / limit),
            currentPage: page
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            ok: false,
            msg: 'Error al obtener todos los sacramentos'
        });
    }
};


const crearSacramento = async (req, res) => {
  const { fecha_sacramento, foja, numero, usuario_id_usuario, institucion_parroquia_id_parroquia, tipo_sacramento_id_tipo } = req.body;

  try {
    const sacramento = await Sacramento.create({
      fecha_sacramento,
      foja,
      numero,
      usuario_id_usuario,
      institucion_parroquia_id_parroquia,
      tipo_sacramento_id_tipo
    });
    res.status(201).json({
      ok: true,
      sacramento
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      ok: false,
      msg: 'Error al crear el sacramento'
    });
  }
};

// Obtener un sacramento por ID
const getSacramento = async (req, res) => {
    const { id } = req.params;
    try {
      const sacramento = await Sacramento.findOne({
        where: { id_sacramento: id, activo: true }
      });
      if (!sacramento) {
        return res.status(404).json({ ok: false, msg: 'Sacramento no encontrado' });
      }
      res.json({ ok: true, sacramento });
    } catch (err) {
      console.error(err);
      res.status(500).json({ ok: false, msg: 'Error al obtener sacramento' });
    }
  };

//Funcion para editar a la persona
const actualizarSacramento = async (req, res) => {
  const id = Number(req.params.id);
  if (Number.isNaN(id)) {
    return res.status(400).json({ ok:false, msg:'ID inválido' });
  }

  const {
    fecha_sacramento,
    foja,
    numero,
    usuario_id_usuario,
    institucion_parroquia_id_parroquia,
    tipo_sacramento_id_tipo
  } = req.body;


  try {
    const sacramento = await Sacramento.findOne({
      where: { id_sacramento: id, activo: true }
    });

    if (!sacramento) {
      return res.status(404).json({ ok:false, msg:'Sacramento no encontrado' });
    }

    const updates = {};
    if (fecha_sacramento !== undefined) updates.fecha_sacramento = fecha_sacramento;
    if (foja !== undefined) updates.foja = foja;
    if (numero !== undefined) updates.numero = numero;
    if (usuario_id_usuario !== undefined) updates.usuario_id_usuario = usuario_id_usuario;
    if (institucion_parroquia_id_parroquia !== undefined) updates.institucion_parroquia_id_parroquia = institucion_parroquia_id_parroquia;
    if (tipo_sacramento_id_tipo !== undefined) updates.tipo_sacramento_id_tipo = tipo_sacramento_id_tipo;

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ ok:false, msg:'No se enviaron campos a actualizar' });
    }

    const sacramentoActualizado = await sacramento.update(updates);

    return res.json({
      ok: true,
      sacramento: sacramentoActualizado.get({ plain: true })
    });

  } catch (e) {
    console.error('Error al actualizar el sacramento:', e);
    return res.status(500).json({ ok:false, msg:'Error al actualizar el sacramento' });
  }
};


// Eliminado lógico de un sacramento
const eliminarSacramento = async (req, res = response) => {
    const { id } = req.params;

    try {
        const sacramento = await Sacramento.findOne({
            where: { id_sacramento: id, activo: true }
        });

        if (!sacramento) {
            return res.status(404).json({
                ok: false,
                msg: 'Sacramento no encontrado'
            });
        }

        await sacramento.update({ activo: false });

        res.json({
            ok: true,
            msg: 'Sacramento eliminado correctamente'
        });
    } catch (error) {
        console.error('Error al eliminar el sacramento:', error);
        res.status(500).json({
            ok: false,
            msg: 'Error al eliminar el sacramento'
        });
    }
};

  module.exports = {
    getSacramentos,
    crearSacramento,
    getSacramento,
    actualizarSacramento,
    eliminarSacramento,
    getAllSacramentos
  };