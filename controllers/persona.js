const { response } = require('express');
const bcrypt = require('bcryptjs');
const Persona = require('../models/Persona');
const { generarJWT } = require('../helpers/jwt');
const decode = require('jsonwebtoken/decode');

// Obtener todos los personas activos
const getPersonas = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const offset = (page - 1) * limit;
        const { count, rows } = await Persona.findAndCountAll({
            where: { activo: true },
            offset,
            limit
        });

        res.json({
            ok: true,
            personas: rows,
            totalItems: count,
            totalPages: Math.ceil(count / limit),
            currentPage: page
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            ok: false,
            msg: 'Error al obtener los personas'
        });
    }
};

// Obtener todos los personas (incluidos los eliminados)
const getAllPersonas = async (req, res) => {
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
            personas: rows,
            totalItems: count,
            totalPages: Math.ceil(count / limit),
            currentPage: page
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            ok: false,
            msg: 'Error al obtener todos las personas'
        });
    }
};


const crearPersona = async (req, res) => {
  const { nombre, apellido_paterno, apellido_materno, carnet_identidad, fecha_nacimiento, lugar_nacimiento, nombre_padre, nombre_madre, estado } = req.body;

  try {
    const existe = await Persona.findOne({ where: { carnet_identidad } });
    if (existe) {
      return res.status(400).json({ ok: false, msg: 'El carnet de identidad ya está registrado' });
    }

    const persona = await Persona.create({
      nombre,
      apellido_paterno,
      apellido_materno,
      carnet_identidad,
      fecha_nacimiento,
      lugar_nacimiento,
      nombre_padre,
      nombre_madre,
      estado
    });
    res.status(201).json({
      ok: true,
      persona: {
        id_persona: persona.id_persona,
        nombre: persona.nombre,
        apellido_paterno: persona.apellido_paterno,
        apellido_materno: persona.apellido_materno,
        carnet_identidad: persona.carnet_identidad,
        fecha_nacimiento: persona.fecha_nacimiento,
        lugar_nacimiento: persona.lugar_nacimiento,
        nombre_padre: persona.nombre_padre,
        nombre_madre: persona.nombre_madre,
        estado: persona.estado
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, msg: 'Hable con el administrador' });
  }
};


//Login de usuario
const loginUsuario = async (req, res) => {
    const { email, password } = req.body;
    try {
      const usuario = await Usuario.findOne({ where: { email, activo: true } });
      if (!usuario) {
        return res.status(400).json({ ok: false, msg: 'Usuario no existe' });
      }

      // Verificar si el usuario esta activo
    if (!usuario.activo) {
      return res.status(400).json({ ok: false, msg: 'El usuario está inactivo' });
    }


    const valid = bcrypt.compareSync(password, usuario.password);
    if (!valid) {
      return res.status(400).json({ ok: false, msg: 'Contraseña incorrecta' });
    }

      //Generar el token
      const token = await generarJWT(usuario.id_usuario, usuario.email);
      console.log(decode(token, { complete: true }));
      
      res.json({
        ok: true,
        uid: usuario.id_usuario,
        email: usuario.email,
        nombre: usuario.nombre,
        rol: usuario.rol,
        token
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ ok: false, msg: 'Hable con el administrador' });
    }
  };

// Obtener un usuario por ID
const getUsuario = async (req, res) => {
    const { id } = req.params;
    try {
      const usuario = await Usuario.findOne({
        where: { id_usuario: id, activo: true }
      });
      if (!usuario) {
        return res.status(404).json({ ok: false, msg: 'Usuario no encontrado' });
      }
      res.json({ ok: true, usuario });
    } catch (err) {
      console.error(err);
      res.status(500).json({ ok: false, msg: 'Error al obtener usuario' });
    }
  };
  
  const revalidarToken = async (req, res) => {
    const { uid, email } = req; // Accede directamente desde req

    if (!uid || !email) {
        return res.status(400).json({
            ok: false,
            msg: 'Faltan datos del usuario'
        });
    }

    try {
        const token = await generarJWT(uid, email);
        res.json({ ok: true, uid, email, token });
    } catch (error) {
        console.log(error);
        res.status(500).json({
            ok: false,
            msg: 'Error al generar el token'
        });
    }
};

//Funcion para editar al usuario
const actualizarUsuario = async (req, res = response) => {
    const { id } = req.params;
    const { nombre, apellido_paterno, apellido_materno, email, password, fecha_nacimiento, rol } = req.body;

    try {
        const usuario = await Usuario.findOne({
            where: { id_usuario: id, activo: true }
        });

        if (!usuario) {
            return res.status(404).json({
                ok: false,
                msg: 'Usuario no encontrado'
            });
        }
        if (email && email !== usuario.email) {
          const yaExiste = await Usuario.findOne({ where: { email } });
          if (yaExiste) return res.status(400).json({ ok:false, msg:'El email ya está en uso' });
        }
        
        const updates = {};
        if (nombre !== undefined) updates.nombre = nombre;
        if (apellido_paterno !== undefined) updates.apellido_paterno = apellido_paterno;
        if (apellido_materno !== undefined) updates.apellido_materno = apellido_materno;
        if (email !== undefined) updates.email = email;
        if (fecha_nacimiento !== undefined) updates.fecha_nacimiento = fecha_nacimiento;
        if (rol !== undefined) updates.rol = rol;

        if (password) {
          const salt = bcrypt.genSaltSync();
          updates.password = bcrypt.hashSync(password, salt);
        }

        await usuario.update(updates);

      const { password: _, ...usuarioPlano } = usuario.get({ plain:true });
      res.json({ ok:true, usuario: usuarioPlano });
    } catch (e) {
      console.error('Error al actualizar el usuario:', e);
      res.status(500).json({ ok:false, msg:'Error al actualizar el usuario' });
    }
};

// Eliminado lógico de un usuario
const eliminarUsuario = async (req, res = response) => {
    const { id } = req.params;

    try {
        const usuario = await Usuario.findOne({
            where: { id_usuario: id, activo: true }
        });

        if (!usuario) {
            return res.status(404).json({
                ok: false,
                msg: 'Usuario no encontrado'
            });
        }
        
        await usuario.update({ activo: false });

        res.json({
            ok: true,
            msg: 'Usuario eliminado correctamente'
        });
    } catch (error) {
        console.error('Error al eliminar el usuario:', error);
        res.status(500).json({
            ok: false,
            msg: 'Error al eliminar el usuario'
        });
    }
};

  module.exports = {
    getUsuarios,
    crearUsuario,
    loginUsuario,
    getUsuario,
    revalidarToken,
    actualizarUsuario,
    eliminarUsuario,
    getAllUsuarios
  };