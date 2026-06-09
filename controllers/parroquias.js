const { response } = require('express');
const Parroquia = require('../models/Parroquia');
const Usuario = require('../models/Usuario');
const Rol = require('../models/Rol');
const UsuarioParroquia = require('../models/UsuarioParroquia');
const { combinarCondiciones } = require('../middlewares/busqueda');

async function auditarCambioEncargado({ encargadoAnterior, nuevoId, req, res }) {
  try {
    const nuevoUsuario = await Usuario.findByPk(nuevoId, {
      attributes: ['id_usuario', 'nombre', 'apellido_paterno', 'apellido_materno', 'email']
    });

    const datoAnterior = encargadoAnterior
      ? {
          id_usuario:       encargadoAnterior.id_usuario,
          nombre:           encargadoAnterior.nombre,
          apellido_paterno: encargadoAnterior.apellido_paterno,
          apellido_materno: encargadoAnterior.apellido_materno,
          email:            encargadoAnterior.email,
        }
      : null;

    const datoNuevo = nuevoUsuario
      ? {
          id_usuario:       nuevoUsuario.id_usuario,
          nombre:           nuevoUsuario.nombre,
          apellido_paterno: nuevoUsuario.apellido_paterno,
          apellido_materno: nuevoUsuario.apellido_materno,
          email:            nuevoUsuario.email,
        }
      : { id_usuario: nuevoId };

    res.locals._instancia = { _datoAnterior: datoAnterior, _datoNuevo: datoNuevo };
    res.locals._entidad   = 'parroquia_encargado';
    res.locals._accion    = encargadoAnterior ? 'UPDATE' : 'CREATE';
  } catch (e) {
    console.warn('No se pudo registrar auditoría de encargado:', e?.message || e);
  }
}


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
            'Parroquia.nombre',
            'Parroquia.direccion',
            'Parroquia.telefono',
            'Parroquia.email'
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
            include: [
              {
                model: Usuario,
                as: 'usuarios',
                attributes: [
                  'id_usuario',
                  'nombre',
                  'apellido_paterno',
                  'apellido_materno',
                  'email'
                ],
                through: {
                  attributes: ['rol_en_parroquia', 'activo'],
                  where: {
                    rol_en_parroquia: 'PARROCO',
                    activo: true
                  }
                },
                required: false
              }
            ],
            offset,
            limit,
            order: [['nombre', 'ASC']]
          });

       res.json({
        ok: true,
        parroquias: rows.map((p) => {
          const plain = p.get({ plain: true });
          const parroco = plain.usuarios?.[0] || null;

          return {
            ...plain,
            parroco,
            usuarios: undefined
          };
        }),
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

  const { nombre, direccion, telefono, email, id_usuario, latitud, longitud } = req.body;

  try {

    const existe = await Parroquia.findOne({ where: { nombre } });

    if (existe) {

      return res.status(400).json({ ok: false, msg: 'La parroquia ya está registrada' });

    }

    const existeEmail = await Parroquia.findOne({ where: { email } });

    if (existeEmail) {

      return res.status(400).json({ ok: false, msg: 'El email ya está registrado' });

    }

    if (id_usuario) {

      const usuario = await Usuario.findOne({

        where: { id_usuario, activo: true },

        include: [

          {

            model: Rol,

            as: 'rol',

            attributes: ['nombre'],

          },

        ],

      });

      if (!usuario) {

        return res.status(400).json({ ok: false, msg: 'El usuario párroco no existe' });

      }

      if (usuario.rol?.nombre !== 'PARROCO' && usuario.rol?.nombre !== 'parroco') {

        return res.status(400).json({

          ok: false,

          msg: 'El usuario seleccionado no tiene rol de párroco',

        });

      }

    }

    const parroquia = await Parroquia.create({

      nombre,

      direccion,

      telefono,

      email,

      latitud:  latitud  !== undefined ? latitud  : null,

      longitud: longitud !== undefined ? longitud : null,

    });

    if (id_usuario) {

      await UsuarioParroquia.create({

        id_usuario,

        id_parroquia: parroquia.id_parroquia,

        rol_en_parroquia: 'PARROCO',

        activo: true,

      });

    }

    return res.status(201).json({

      ok: true,

      parroquia,

    });

  } catch (err) {

    console.error(err);

    return res.status(500).json({ ok: false, msg: 'Hable con el administrador' });

  }

};



// Obtener una parroquia por ID
const getParroquia = async (req, res) => {
    const { id } = req.params;
    try {
      const parroquia = await Parroquia.findOne({
          where: { id_parroquia: id },
          include: [
            {
              model: Usuario,
              as: 'usuarios',
              attributes: [
                'id_usuario',
                'nombre',
                'apellido_paterno',
                'apellido_materno',
                'email'
              ],
              through: {
                attributes: ['rol_en_parroquia', 'activo'],
                where: {
                  rol_en_parroquia: 'PARROCO',
                  activo: true
                }
              },
              required: false
            }
          ]
        });
      if (!parroquia) {
        return res.status(404).json({ ok: false, msg: 'Parroquia no encontrada' });
      }

      const plain = parroquia.get({ plain: true });
      const parroco = plain.usuarios?.[0] || null;

      res.json({
        ok: true,
        parroquia: {
          ...plain,
          parroco,
          usuarios: undefined
        }
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ ok: false, msg: 'Error al obtener parroquia' });
    }
  };

//Funcion para editar a la persona
const actualizarParroquia = async (req, res = response) => {
  const { id } = req.params;
  const { nombre, direccion, telefono, email, id_usuario, latitud, longitud } = req.body;

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
    if (latitud !== undefined) updates.latitud = latitud;
    if (longitud !== undefined) updates.longitud = longitud;

    await parroquia.update(updates);

    if (id_usuario !== undefined && id_usuario !== null) {
      // Capturar encargado actual antes de reemplazarlo
      const relacionAnterior = await UsuarioParroquia.findOne({
        where: { id_parroquia: id, rol_en_parroquia: 'PARROCO', activo: true },
        include: [{ model: Usuario, as: 'usuario', attributes: ['id_usuario', 'nombre', 'apellido_paterno', 'apellido_materno', 'email'] }]
      });
      const encargadoAnterior = relacionAnterior?.usuario ?? null;

      await UsuarioParroquia.update(
        { activo: false, fecha_fin: new Date() },
        { where: { id_parroquia: id, rol_en_parroquia: 'PARROCO', activo: true } }
      );

      await UsuarioParroquia.create({
        id_usuario,
        id_parroquia: Number(id),
        rol_en_parroquia: 'PARROCO',
        activo: true,
      });

      // Solo auditar si realmente cambió el encargado
      if (!encargadoAnterior || encargadoAnterior.id_usuario !== Number(id_usuario)) {
        await auditarCambioEncargado({ encargadoAnterior, nuevoId: id_usuario, req, res });
      }
    }

    return res.json({
      ok: true,
      parroquia: parroquia.get({ plain: true })
    });

  } catch (e) {
    console.error('Error al actualizar la parroquia:', e);
    return res.status(500).json({
      ok: false,
      msg: 'Error al actualizar la parroquia'
    });
  }
};


  module.exports = {
    getParroquias,
    crearParroquia,
    getParroquia,
    actualizarParroquia,
  };