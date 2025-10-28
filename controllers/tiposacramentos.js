const { response } = require('express');
const Persona = require('../models/TipoSacramento');

// Obtener todos los tipos de sacramento activos
const getTiposSacramento = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const offset = (page - 1) * limit;
        const { count, rows } = await Persona.findAndCountAll({
            offset,
            limit
        });

        res.json({
            ok: true,
            tipos: rows,
            totalItems: count,
            totalPages: Math.ceil(count / limit),
            currentPage: page
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            ok: false,
            msg: 'Error al obtener los tipos de sacramento'
        });
    }
};

// Obtener todos los tipos de sacramento (incluidos los eliminados)
const getAllTiposSacramento = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const offset = (page - 1) * limit;
        const { count, rows } = await TipoSacramento.findAndCountAll({
            offset,
            limit
        });

        res.json({
            ok: true,
            tipos: rows,
            totalItems: count,
            totalPages: Math.ceil(count / limit),
            currentPage: page
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            ok: false,
            msg: 'Error al obtener todos los tipos de sacramento'
        });
    }
};


const crearTipoSacramento = async (req, res) => {
  const { nombre, descripcion } = req.body;

  try {
    const existe = await TipoSacramento.findOne({ where: { nombre } });
    if (existe) {
      return res.status(400).json({ ok: false, msg: 'El tipo de sacramento ya está registrado' });
    }

    const tipo = await TipoSacramento.create({
      nombre,
      descripcion
    });
    res.status(201).json({
      ok: true,
      tipo: {
        id_tipo: tipo.id_tipo,
        nombre: tipo.nombre,
        descripcion: tipo.descripcion
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, msg: 'Hable con el administrador' });
  }
};



// Obtener un tipo de sacramento por ID
const getTipoSacramento = async (req, res) => {
    const { id } = req.params;
    try {
      const tipo = await TipoSacramento.findOne({
        where: { id_tipo: id }
      });
      if (!tipo) {
        return res.status(404).json({ ok: false, msg: 'Tipo de sacramento no encontrado' });
      }
      res.json({ ok: true, tipo });
    } catch (err) {
      console.error(err);
      res.status(500).json({ ok: false, msg: 'Error al obtener tipo de sacramento' });
    }
  };

//Funcion para editar a la persona
const actualizarTipoSacramento = async (req, res = response) => {
    const { id } = req.params;
    const { nombre, descripcion } = req.body;

    try {
        const tipo = await TipoSacramento.findOne({
            where: { id_tipo: id }
        });

        if (!tipo) {
            return res.status(404).json({
                ok: false,
                msg: 'Tipo de sacramento no encontrado'
            });
        }
        
        const updates = {};
        if (nombre !== undefined) updates.nombre = nombre;
        if (descripcion !== undefined) updates.descripcion = descripcion;

        await tipo.update(updates);

    } catch (e) {
      console.error('Error al actualizar el tipo de sacramento:', e);
      res.status(500).json({ ok:false, msg:'Error al actualizar el tipo de sacramento' });
    }
};

// Eliminado lógico de un tipo de sacramento
const eliminarTipoSacramento = async (req, res = response) => {
    const { id } = req.params;

    try {
        const tipo = await TipoSacramento.findOne({
            where: { id_tipo: id, activo: true }
        });

        if (!tipo) {
            return res.status(404).json({
                ok: false,
                msg: 'Tipo de sacramento no encontrado'
            });
        }

        await tipo.update({ activo: false });

        res.json({
            ok: true,
            msg: 'Tipo de sacramento eliminado correctamente'
        });
    } catch (error) {
        console.error('Error al eliminar el tipo de sacramento:', error);
        res.status(500).json({
            ok: false,
            msg: 'Error al eliminar el tipo de sacramento'
        });
    }
};

  module.exports = {
    getAllTiposSacramento,
    crearTipoSacramento,
    getTipoSacramento,
    actualizarTipoSacramento,
    eliminarTipoSacramento,
  };