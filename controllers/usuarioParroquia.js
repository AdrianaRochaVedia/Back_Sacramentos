const UsuarioParroquia = require('../models/UsuarioParroquia');
const Usuario = require('../models/Usuario');
const Rol = require('../models/Rol');
const Parroquia = require('../models/Parroquia');

const getAsignaciones = async (req, res) => {
  try {
    const { id_usuario, id_parroquia, rol_en_parroquia, activo } = req.query;

    const where = {};

    if (id_usuario) where.id_usuario = id_usuario;
    if (id_parroquia) where.id_parroquia = id_parroquia;
    if (rol_en_parroquia) where.rol_en_parroquia = rol_en_parroquia;
    if (activo !== undefined && activo !== '') where.activo = activo === 'true';

    const asignaciones = await UsuarioParroquia.findAll({
      where,
      include: [
        {
          model: Usuario,
          as: 'usuario',
          attributes: [
            'id_usuario',
            'nombre',
            'apellido_paterno',
            'apellido_materno',
            'email',
            'activo',
          ],
          include: [
            {
              model: Rol,
              as: 'rol',
              attributes: ['id_rol', 'nombre'],
            },
          ],
        },
        {
          model: Parroquia,
          as: 'parroquia',
          attributes: ['id_parroquia', 'nombre', 'direccion', 'telefono', 'email'],
        },
      ],
      order: [['fecha_asignacion', 'DESC']],
    });

    return res.json({
      ok: true,
      asignaciones,
    });
  } catch (error) {
    console.error('Error al obtener asignaciones:', error);
    return res.status(500).json({
      ok: false,
      msg: 'Error al obtener asignaciones de usuarios a parroquias',
    });
  }
};

const getAsignacionById = async (req, res) => {
  try {
    const { id } = req.params;

    const asignacion = await UsuarioParroquia.findByPk(id, {
      include: [
        {
          model: Usuario,
          as: 'usuario',
          attributes: [
            'id_usuario',
            'nombre',
            'apellido_paterno',
            'apellido_materno',
            'email',
            'activo',
          ],
          include: [
            {
              model: Rol,
              as: 'rol',
              attributes: ['id_rol', 'nombre'],
            },
          ],
        },
        {
          model: Parroquia,
          as: 'parroquia',
          attributes: ['id_parroquia', 'nombre', 'direccion', 'telefono', 'email'],
        },
      ],
    });

    if (!asignacion) {
      return res.status(404).json({
        ok: false,
        msg: 'Asignación no encontrada',
      });
    }

    return res.json({
      ok: true,
      asignacion,
    });
  } catch (error) {
    console.error('Error al obtener asignación:', error);
    return res.status(500).json({
      ok: false,
      msg: 'Error al obtener asignación',
    });
  }
};

const crearAsignacion = async (req, res) => {
  try {
    const { id_usuario, id_parroquia, rol_en_parroquia } = req.body;

    if (!id_usuario || !id_parroquia || !rol_en_parroquia) {
      return res.status(400).json({
        ok: false,
        msg: 'id_usuario, id_parroquia y rol_en_parroquia son obligatorios',
      });
    }

    const usuario = await Usuario.findByPk(id_usuario);
    if (!usuario) {
      return res.status(404).json({
        ok: false,
        msg: 'El usuario no existe',
      });
    }

    const parroquia = await Parroquia.findByPk(id_parroquia);
    if (!parroquia) {
      return res.status(404).json({
        ok: false,
        msg: 'La parroquia no existe',
      });
    }

    const yaExiste = await UsuarioParroquia.findOne({
      where: {
        id_usuario,
        id_parroquia,
        rol_en_parroquia,
        activo: true,
      },
    });

    if (yaExiste) {
      return res.status(400).json({
        ok: false,
        msg: 'El usuario ya tiene esa asignación activa en la parroquia',
      });
    }

    const asignacion = await UsuarioParroquia.create({
      id_usuario,
      id_parroquia,
      rol_en_parroquia,
      activo: true,
    });

    return res.status(201).json({
      ok: true,
      msg: 'Usuario asignado a parroquia correctamente',
      asignacion,
    });
  } catch (error) {
    console.error('Error al crear asignación:', error);
    return res.status(500).json({
      ok: false,
      msg: 'Error al crear asignación',
    });
  }
};

const actualizarAsignacion = async (req, res) => {
  try {
    const { id } = req.params;
    const { id_usuario, id_parroquia, rol_en_parroquia, activo } = req.body;

    const asignacion = await UsuarioParroquia.findByPk(id);

    if (!asignacion) {
      return res.status(404).json({
        ok: false,
        msg: 'Asignación no encontrada',
      });
    }

    if (id_usuario !== undefined) asignacion.id_usuario = id_usuario;
    if (id_parroquia !== undefined) asignacion.id_parroquia = id_parroquia;
    if (rol_en_parroquia !== undefined) asignacion.rol_en_parroquia = rol_en_parroquia;

    if (activo !== undefined) {
      asignacion.activo = activo === true || activo === 'true';

      if (!asignacion.activo) {
        asignacion.fecha_fin = new Date();
      } else {
        asignacion.fecha_fin = null;
      }
    }

    await asignacion.save();

    return res.json({
      ok: true,
      msg: 'Asignación actualizada correctamente',
      asignacion,
    });
  } catch (error) {
    console.error('Error al actualizar asignación:', error);
    return res.status(500).json({
      ok: false,
      msg: 'Error al actualizar asignación',
    });
  }
};

const desactivarAsignacion = async (req, res) => {
  try {
    const { id } = req.params;

    const asignacion = await UsuarioParroquia.findByPk(id);

    if (!asignacion) {
      return res.status(404).json({
        ok: false,
        msg: 'Asignación no encontrada',
      });
    }

    asignacion.activo = false;
    asignacion.fecha_fin = new Date();

    await asignacion.save();

    return res.json({
      ok: true,
      msg: 'Asignación desactivada correctamente',
      asignacion,
    });
  } catch (error) {
    console.error('Error al desactivar asignación:', error);
    return res.status(500).json({
      ok: false,
      msg: 'Error al desactivar asignación',
    });
  }
};

module.exports = {
  getAsignaciones,
  getAsignacionById,
  crearAsignacion,
  actualizarAsignacion,
  desactivarAsignacion,
};