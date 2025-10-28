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
            where: { isDeleted: false },
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
    const { nombre, correo, contrasenia, tipo } = req.body;
    try {
      // Verificar si existe el correo
      const existe = await Usuario.findOne({ where: { correo } });
      if (existe) {
        return res.status(400).json({ ok: false, msg: 'El correo ya está registrado' });
      }
  
      // Encriptar contraseña antes de crear el usuario
      const salt = bcrypt.genSaltSync();
      const contraseniaHasheada = bcrypt.hashSync(contrasenia, salt);
  
      const usuario = await Usuario.create({
        nombre,
        correo,
        contrasenia: contraseniaHasheada,
        tipo,
        isDeleted: false
      });
  
      const token = await generarJWT(usuario.id_usuario, usuario.correo);
      console.log(decode(token, { complete: true }));
      res.status(201).json({
        ok: true,
        uid: usuario.id_usuario,
        nombre: usuario.nombre,
        correo: usuario.correo,
      
        token
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ ok: false, msg: 'Hable con el administrador' });
    }
  };
  

//Login de usuario
const loginUsuario = async (req, res) => {
    const { correo, contrasenia } = req.body;
    try {
      const usuario = await Usuario.findOne({ where: { correo, isDeleted: false } });
      if (!usuario) {
        return res.status(400).json({ ok: false, msg: 'Usuario no existe' });
      }

      const valid = bcrypt.compareSync(contrasenia, usuario.contrasenia);
      if (!valid) {
        return res.status(400).json({ ok: false, msg: 'Contraseña incorrecta' });
      }

      //Generar el token
      const token = await generarJWT(usuario.id_usuario, usuario.correo);
      console.log(decode(token, { complete: true }));
      
      res.json({
        ok: true,
        uid: usuario.id_usuario,
        correo: usuario.correo,
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
        where: { id_usuario: id, isDeleted: false }
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
    const { uid, correo } = req; // Accede directamente desde req

    if (!uid || !correo) {
        return res.status(400).json({
            ok: false,
            msg: 'Faltan datos del usuario'
        });
    }

    try {
        const token = await generarJWT(uid, correo);
        res.json({ ok: true, uid, correo, token });
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
    const { nombre,correo,tipo } = req.body;

    try {
        const usuario = await Usuario.findOne({
            where: { id_usuario: id, isDeleted: false }
        });

        if (!usuario) {
            return res.status(404).json({
                ok: false,
                msg: 'Usuario no encontrado'
            });
        }
        // Actualizar campos
        await usuario.update({
            tipo,
            nombre,
            correo,
        });

        res.json({
            ok: true,
            usuario
        });
    } catch (error) {
        console.error('Error al actualizar el usuario:', error);
        res.status(500).json({
            ok: false,
            msg: 'Error al actualizar el usuario'
        });
    }
};

// Eliminado lógico de un usuario
const eliminarUsuario = async (req, res = response) => {
    const { id } = req.params;

    try {
        const usuario = await Usuario.findOne({
            where: { id_usuario: id, isDeleted: false }
        });

        if (!usuario) {
            return res.status(404).json({
                ok: false,
                msg: 'Usuario no encontrado'
            });
        }
        
        await usuario.update({ isDeleted: true });

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