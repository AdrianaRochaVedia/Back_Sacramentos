const { response } = require('express');
const Parroquia = require('../models/Parroquia');
const { combinarCondiciones } = require('../middlewares/busqueda');

// Obtener todas las parroquias con búsqueda y filtros
const getParroquias = async (req, res = response) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const offset = (page - 1) * limit;
        
        const { 
            search,
            nombre,
            direccion,
            telefono,
            email
        } = req.query;
  
        const camposBusqueda = [
            'nombre',
            'direccion',
            'telefono',
            'email'
        ];
        
        const filtros = {
            nombre,
            direccion,
            telefono,
            email
        };
        
        const whereConditions = combinarCondiciones(search, camposBusqueda, filtros);

        const { count, rows } = await Parroquia.findAndCountAll({
            where: whereConditions,
            offset,
            limit,
            order: [['nombre', 'ASC']] 
        });

        res.json({
            ok: true,
            parroquias: rows,
            totalItems: count,
            totalPages: Math.ceil(count / limit),
            currentPage: page,
            filtros_aplicados: {
                search,
                nombre,
                direccion,
                telefono,
                email
            }
        });
    } catch (error) {
        console.error('Error en getParroquias:', error);
        res.status(500).json({
            ok: false,
            msg: 'Error al obtener las parroquias',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

const crearParroquia = async (req, res) => {
  const { nombre, direccion, telefono, email } = req.body;

  try {
    const existe = await Parroquia.findOne({ where: { nombre } });
    if (existe) {
      return res.status(400).json({ ok: false, msg: 'La parroquia ya está registrada' });
    }

    const parroquia = await Parroquia.create({
      nombre,
      direccion,
      telefono,
      email
    });
    res.status(201).json({
      ok: true,
      parroquia: {
        id_parroquia: parroquia.id_parroquia,
        nombre: parroquia.nombre,
        direccion: parroquia.direccion,
        telefono: parroquia.telefono,
        email: parroquia.email
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, msg: 'Hable con el administrador' });
  }
};



// Obtener una parroquia por ID
const getParroquia = async (req, res) => {
    const { id } = req.params;
    try {
      const parroquia = await Parroquia.findOne({
        where: { id_parroquia: id }
      });
      if (!parroquia) {
        return res.status(404).json({ ok: false, msg: 'Parroquia no encontrada' });
      }
      res.json({ ok: true, parroquia });
    } catch (err) {
      console.error(err);
      res.status(500).json({ ok: false, msg: 'Error al obtener parroquia' });
    }
  };

//Funcion para editar a la persona
const actualizarParroquia = async (req, res = response) => {
    const { id } = req.params;
    const { nombre, direccion, telefono, email } = req.body;

    try {
        const parroquia = await Parroquia.findOne({
            where: { id_parroquia: id }
        });

        if (!parroquia) {
            return res.status(404).json({
                ok: false,
                msg: 'Parroquia no encontrada'
            });
        }
        
        const updates = {};
        if (nombre !== undefined) updates.nombre = nombre;
        if (direccion !== undefined) updates.direccion = direccion;
        if (telefono !== undefined) updates.telefono = telefono;
        if (email !== undefined) updates.email = email;

        await parroquia.update(updates);
        return res.json({
            ok: true,
            parroquia: parroquia.get({ plain: true })
        });

    } catch (e) {
      console.error('Error al actualizar la parroquia:', e);
      res.status(500).json({ ok:false, msg:'Error al actualizar la parroquia' });
    }
};


  module.exports = {
    getParroquias,
    crearParroquia,
    getParroquia,
    actualizarParroquia,
  };