const { Op } = require('sequelize');
const { sequelize } = require('../database/config');
const Rol = require('../models/Rol');
const Usuario = require('../models/Usuario');
const Permiso = require('../models/Permisos');
const RolPermiso = require('../models/RolPermiso');

//Roles con sus permisos
const getRoles = async (req, res) => {
    try {
        const roles = await Rol.findAll({
            where: { activo: true },
            include: [{
                model: Permiso,
                as: 'permisos',
                attributes: ['id_permiso', 'nombre'],
                through: { attributes: ['visible_en_menu', 'fecha_registro'] }
            }],
            order: [['id_rol', 'ASC']]
        });

        res.json({ ok: true, roles });

    } catch (error) {
        console.error(error);
        res.status(500).json({ ok: false, msg: 'Error al obtener los roles' });
    }
};

//Rol por id
const getRolById = async (req, res) => {
    const { id } = req.params;

    try {
        const rol = await Rol.findOne({
            where: { id_rol: id, activo: true },
            include: [{
                model: Permiso,
                as: 'permisos',
                attributes: ['id_permiso', 'nombre'],
                through: { attributes: ['visible_en_menu', 'fecha_registro'] }
            }]
        });

        if (!rol) {
            return res.status(404).json({ ok: false, msg: 'Rol no encontrado' });
        }

        res.json({ ok: true, rol });

    } catch (error) {
        console.error(error);
        res.status(500).json({ ok: false, msg: 'Error al obtener el rol' });
    }
};

//Verificar su ya existe un rol con los mismos permisos para que no deje crear otro
const normalizarIds = (lista) =>
    lista
        .map(p => Number(typeof p === 'object' ? p.id_permiso : p))
        .filter(Boolean)
        .sort((a, b) => a - b)
        .join(',');

const verificarPermisosRepetidos = async (permisosIds, excludeRolId = null) => {
    const roles = await Rol.findAll({
        where: {
            activo: true,
            ...(excludeRolId && { id_rol: { [Op.ne]: excludeRolId } })
        },
        include: [{
            model: Permiso,
            as: 'permisos',
            attributes: ['id_permiso']
        }]
    });

    const permisosOrdenados = normalizarIds(permisosIds);

    const rolDuplicado = roles.find(rol => {
        const permisosRol = normalizarIds(rol.permisos);
        return permisosRol === permisosOrdenados;
    });

    return rolDuplicado || null;
};

const _normalizarNombre = (raw) =>
    raw?.trim().toUpperCase().replace(/\s+/g, '_') || '';

const crearRol = async (req, res) => {
    const nombre = _normalizarNombre(req.body.nombre);
    const { descripcion, permisos = [] } = req.body;
    try {
        if (!nombre)
            return res.status(400).json({ ok: false, msg: 'El nombre del rol es obligatorio' });

        if (!permisos || permisos.length === 0)
            return res.status(400).json({ ok: false, msg: 'El rol debe tener al menos un permiso' });

        const nombreExiste = await Rol.findOne({ where: { nombre, activo: true } });
        if (nombreExiste) {
            return res.status(400).json({ ok: false, msg: `Ya existe un rol con el nombre "${nombre}"` });
        }

        const rolDuplicado = await verificarPermisosRepetidos(permisos);
        if (rolDuplicado) {
            return res.status(400).json({
                ok: false,
                msg: `Ya existe el rol "${rolDuplicado.nombre}" con exactamente los mismos permisos`
            });
        }

        const rol = await Rol.create({ nombre, descripcion });
        if (permisos.length > 0) {
            const rolPermisos = permisos.map(p => ({
                id_rol: rol.id_rol,
                id_permiso: typeof p === 'object' ? p.id_permiso : p,
                visible_en_menu: typeof p === 'object' ? (p.visible_en_menu ?? true) : true
            }));
            await RolPermiso.bulkCreate(rolPermisos);
        }

        const rolConPermisos = await Rol.findByPk(rol.id_rol, {
            include: [{
                model: Permiso,
                as: 'permisos',
                attributes: ['id_permiso', 'nombre'],
                through: { attributes: ['visible_en_menu', 'fecha_registro'] }
            }]
        });

        res.status(201).json({ ok: true, rol: rolConPermisos });

    } catch (error) {
        console.error(error);
        res.status(500).json({ ok: false, msg: 'Error al crear el rol' });
    }
};

//Actualizar rol
const actualizarRol = async (req, res) => {
  const { id } = req.params;
  const nombre = req.body.nombre !== undefined ? _normalizarNombre(req.body.nombre) : undefined;
  const { descripcion, permisos, activo } = req.body;

  try {
    const rol = await Rol.findOne({ where: { id_rol: id } });

    if (!rol) {
      return res.status(404).json({ ok: false, msg: 'Rol no encontrado' });
    }

    if (nombre && nombre !== rol.nombre) {
      const nombreExiste = await Rol.findOne({
        where: {
          nombre,
          activo: true,
          id_rol: { [Op.ne]: id }
        }
      });

      if (nombreExiste) {
        return res.status(400).json({
          ok: false,
          msg: `Ya existe un rol con el nombre "${nombre}"`
        });
      }
    }

    if (activo === false || activo === 'false') {
      const usuariosConRol = await Usuario.count({
        where: {
          id_rol: id,
          activo: true
        }
      });

      if (usuariosConRol > 0) {
        return res.status(400).json({
          ok: false,
          msg: `No se puede desactivar el rol, hay ${usuariosConRol} usuario(s) activo(s) asignado(s) a este rol`
        });
      }
    }

    if (permisos !== undefined) {
      if (permisos.length === 0)
        return res.status(400).json({ ok: false, msg: 'El rol debe tener al menos un permiso' });

      const rolDuplicado = await verificarPermisosRepetidos(permisos, id);
      if (rolDuplicado) {
        return res.status(400).json({
          ok: false,
          msg: `Ya existe el rol "${rolDuplicado.nombre}" con exactamente los mismos permisos`
        });
      }
    }

    const includePermisos = [{
      model: Permiso,
      as: 'permisos',
      attributes: ['id_permiso', 'nombre'],
      through: { attributes: ['visible_en_menu', 'fecha_registro'] }
    }];

    const rolPrevio = await Rol.findByPk(id, { include: includePermisos });

    const updates = {};

    if (nombre !== undefined) updates.nombre = nombre;
    if (descripcion !== undefined) updates.descripcion = descripcion;
    if (activo !== undefined) {
      updates.activo = activo === true || activo === 'true';
    }

    res.locals._instancia = rol;
    await rol.update(updates);

    if (permisos !== undefined) {
      await sequelize.transaction(async (t) => {
        const existentes = await RolPermiso.findAll({ where: { id_rol: id }, transaction: t });
        const mapaExistentes = Object.fromEntries(
          existentes.map(rp => [rp.id_permiso, rp.visible_en_menu])
        );

        await RolPermiso.destroy({ where: { id_rol: id }, transaction: t });

        if (permisos.length > 0) {
          const rolPermisos = permisos.map(p => {
            const idPermiso = typeof p === 'object' ? p.id_permiso : p;
            const visibleExplicito = typeof p === 'object' ? p.visible_en_menu : undefined;
            const visiblePrevio = mapaExistentes[idPermiso];
            const visible = visibleExplicito !== undefined && visibleExplicito !== null
              ? visibleExplicito
              : visiblePrevio !== undefined
                ? visiblePrevio
                : true;
            return { id_rol: parseInt(id), id_permiso: idPermiso, visible_en_menu: visible };
          });

          await RolPermiso.bulkCreate(rolPermisos, { transaction: t });
        }
      });
    }

    const rolActualizado = await Rol.findByPk(id, { include: includePermisos });

    res.locals._instancia._datoAnterior = rolPrevio.get({ plain: true });
    res.locals._instancia._datoNuevo    = rolActualizado.get({ plain: true });

    return res.json({
      ok: true,
      msg: 'Rol actualizado correctamente',
      rol: rolActualizado
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({
      ok: false,
      msg: 'Error al actualizar el rol'
    });
  }
};

//Eliminacion lógica del rol
const eliminarRol = async (req, res) => {
    const { id } = req.params;
    try {
        const rol = await Rol.findOne({ where: { id_rol: id, activo: true } });
        if (!rol) {
            return res.status(404).json({ ok: false, msg: 'Rol no encontrado' });
        }

        const usuariosConRol = await Usuario.count({ where: { id_rol: id } });
        if (usuariosConRol > 0) {
            return res.status(400).json({
                ok: false,
                msg: `No se puede eliminar el rol, hay ${usuariosConRol} usuario(s) asignado(s) a este rol`
            });
        }

        await rol.update({ activo: false });
        res.json({ ok: true, msg: 'Rol eliminado correctamente' });

    } catch (error) {
        console.error(error);
        res.status(500).json({ ok: false, msg: 'Error al eliminar el rol' });
    }
};

module.exports = {
    getRoles,
    getRolById,
    crearRol,
    actualizarRol,
    eliminarRol
};