const { response } = require('express');
const bcrypt = require('bcryptjs');
const Usuario = require('../models/Usuario');
const { generarJWT } = require('../helpers/jwt');
const decode = require('jsonwebtoken/decode');

// Obtener todos los usuarios activos
const getUsuarios = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const offset = (page - 1) * limit;
        const { count, rows } = await Usuario.findAndCountAll({
            where: { activo: true },
            offset,
            limit
        });

        res.json({
            ok: true,
            usuarios: rows,
            totalItems: count,
            totalPages: Math.ceil(count / limit),
            currentPage: page
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            ok: false,
            msg: 'Error al obtener los usuarios'
        });
    }
};

// Obtener todos los usuarios (incluidos los eliminados)
const getAllUsuarios = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const offset = (page - 1) * limit;
        const { count, rows } = await Usuario.findAndCountAll({
            offset,
            limit
        });

        res.json({
            ok: true,
            usuarios: rows,
            totalItems: count,
            totalPages: Math.ceil(count / limit),
            currentPage: page
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            ok: false,
            msg: 'Error al obtener todos los usuarios'
        });
    }
};


const crearUsuario = async (req, res) => {
  const { nombre, apellido_paterno, apellido_materno, email, password, fecha_nacimiento, rol } = req.body;

  try {
    const existe = await Usuario.findOne({ where: { email } });
    if (existe) {
      return res.status(400).json({ ok: false, msg: 'El email ya está registrado' });
    }

    // Manejar contraseña opcional: permitir vacío o ausente
    const crypto = require('crypto');
    let passwordHasheada;

    if (password && password.trim() !== '') {
      const salt = bcrypt.genSaltSync();
      passwordHasheada = bcrypt.hashSync(password, salt);
    } else {
      // Generar una contraseña temporal aleatoria para cumplir el campo NOT NULL
      const tempPassword = crypto.randomBytes(16).toString('hex') + 'Aa1!';
      const salt = bcrypt.genSaltSync();
      passwordHasheada = bcrypt.hashSync(tempPassword, salt);
    }

    const usuario = await Usuario.create({
      nombre,
      apellido_paterno,
      apellido_materno,
      email,
      password: passwordHasheada,
      fecha_nacimiento,
      rol,
    });

    const token = await generarJWT(usuario.id_usuario, usuario.email);

    res.status(201).json({
      ok: true,
      usuario: {
        id_usuario: usuario.id_usuario,
        nombre: usuario.nombre,
        apellido_paterno: usuario.apellido_paterno,
        apellido_materno: usuario.apellido_materno,
        email: usuario.email,
        fecha_nacimiento: usuario.fecha_nacimiento,
        activo: usuario.activo,
        rol: usuario.rol,
      },
      token,
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