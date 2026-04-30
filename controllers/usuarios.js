const { response } = require('express');
const bcrypt = require('bcryptjs');
const crypto = require('crypto'); 
const Usuario = require('../models/Usuario');
const Rol = require('../models/Rol');
const ConfiguracionSeguridad = require('../models/ConfiguracionSeguridad');
const DominioPermitido = require('../models/DominioPermitido');
const UsuarioParroquia = require('../models/UsuarioParroquia');
const Parroquia = require('../models/Parroquia');
const { generarJWT } = require('../helpers/jwt');
const { combinarCondiciones } = require('../middlewares/busqueda');
const { verifyTurnstileToken } = require('../helpers/turnstile');
const { passwordFuerte } = require('../helpers/validar-password');
const { verificarBloqueo, registrarIntentoFallido, resetearIntentos } = require('../helpers/seguridad/manejarIntentos');
const { verificarHistorial, guardarEnHistorial } = require('../helpers/seguridad/manejarHistorial');
const verificarExpiracion = require('../helpers/seguridad/verificarExpiracion');
const { generarCodigo2FA } = require('../helpers/twoFactorCode');
const { generarToken2FA, verificarToken2FA } = require('../helpers/twoFactorToken');
const { sendMail } = require('../helpers/mailer');
const {
  twoFactorEmail,
  cuentaDesbloqueadaEmail
} = require('../helpers/emailTemplates');

const validarDominioCorreo = async (email) => {
  if (!email || !email.includes('@')) return false;

  const dominioEmail = email.split('@')[1].toLowerCase();

  const dominiosPermitidos = await DominioPermitido.findAll({
    where: { activo: true },
  });

  return dominiosPermitidos.some((d) =>
    dominioEmail === d.dominio || dominioEmail.endsWith(`.${d.dominio}`)
  );
};

// Obtener todos los usuarios activos
// Obtener todos los usuarios activos
const getUsuarios = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const {
      search,
      nombre,
      apellido_paterno,
      apellido_materno,
      email,
      fecha_nacimiento,
      activo,
      rol
    } = req.query;

    const camposBusqueda = [
      'nombre',
      'apellido_paterno',
      'apellido_materno',
      'email',
      'fecha_nacimiento'
    ];

    const filtros = {
      nombre,
      apellido_paterno,
      apellido_materno,
      email,
      fecha_nacimiento,
      activo: activo !== undefined ? activo : true
    };

    const whereConditions = combinarCondiciones(search, camposBusqueda, filtros);
    const whereRol = rol ? { nombre: rol } : {};

    const { count, rows } = await Usuario.findAndCountAll({
      where: whereConditions,
      attributes: {
        exclude: ['password', 'password_hash']
      },
      include: [
        {
          model: Rol,
          as: 'rol',
          attributes: ['id_rol', 'nombre', 'descripcion'],
          where: whereRol,
          required: !!rol
        },
        {
          model: Parroquia,
          as: 'parroquias',
          attributes: ['id_parroquia', 'nombre', 'direccion'],
          through: {
            attributes: ['rol_en_parroquia', 'activo'],
            where: {
              activo: true
            }
          },
          required: false
        }
      ],
      offset,
      limit,
      order: [
        ['apellido_paterno', 'ASC'],
        ['apellido_materno', 'ASC'],
        ['nombre', 'ASC'],
        ['email', 'ASC']
      ]
    });

    res.json({
      ok: true,
      usuarios: rows,
      totalItems: count,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      filtros_aplicados: {
        search,
        nombre,
        apellido_paterno,
        apellido_materno,
        email,
        fecha_nacimiento,
        rol,
        activo
      }
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ ok: false, msg: 'Error al obtener los usuarios' });
  }
};

// Obtener todos los usuarios (incluidos los eliminados)
// Obtener todos los usuarios (incluidos los eliminados)
const getAllUsuarios = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const { count, rows } = await Usuario.findAndCountAll({
      attributes: {
        exclude: ['password', 'password_hash']
      },
      include: [
        {
          model: Rol,
          as: 'rol',
          attributes: ['id_rol', 'nombre', 'descripcion'],
          required: false
        },
        
         {
          model: Parroquia,
          as: 'parroquias',
          attributes: ['id_parroquia', 'nombre', 'direccion'],
          through: {
            attributes: ['rol_en_parroquia', 'activo'],
            where: {
              activo: true
            }
          },
          required: false
        }
      ],
      offset,
      limit,
      order: [
        ['apellido_paterno', 'ASC'],
        ['apellido_materno', 'ASC'],
        ['nombre', 'ASC'],
        ['email', 'ASC']
      ]
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
// Obtener un usuario por ID
const getUsuario = async (req, res) => {
  const { id } = req.params;

  try {
    const usuario = await Usuario.findOne({
      where: { id_usuario: id, activo: true },
      attributes: {
        exclude: ['password', 'password_hash']
      },
      include: [
        {
          model: Rol,
          as: 'rol',
          attributes: ['id_rol', 'nombre', 'descripcion'],
          required: false
        },
         {
          model: Parroquia,
          as: 'parroquias',
          attributes: ['id_parroquia', 'nombre', 'direccion'],
          through: {
            attributes: ['rol_en_parroquia', 'activo'],
            where: {
              activo: true
            }
          },
          required: false
        }
      ],
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


const crearUsuario = async (req, res) => {
    const { nombre, apellido_paterno, apellido_materno, email, password, fecha_nacimiento, id_rol, id_parroquia } = req.body;
    try {
        const existe = await Usuario.findOne({ where: { email } });
        if (existe) {
            return res.status(400).json({ ok: false, msg: 'El email ya está registrado' });
        }

        const dominioValido = await validarDominioCorreo(email);

        if (!dominioValido) {
          return res.status(400).json({
            ok: false,
            msg: 'El dominio del correo no está permitido'
          });
        }

        let rolExiste = null;

        if (id_rol) {
            rolExiste = await Rol.findByPk(id_rol);
            if (!rolExiste) {
                return res.status(400).json({ ok: false, msg: 'El rol especificado no existe' });
            }
        }

        if (id_parroquia) {
          const Parroquia = require('../models/Parroquia');
          const parroquiaExiste = await Parroquia.findByPk(id_parroquia);
          if (!parroquiaExiste) {
              return res.status(400).json({ ok: false, msg: 'La parroquia especificada no existe' });
          }
        } 
        if (!id_parroquia){
          return res.status(400).json({ ok: false, msg: 'La parroquia es obligatoria' });
        }

        let passwordPlana;
        if (password && password.trim() !== '') {
            try {
                await passwordFuerte(password);
            } catch (err) {
                return res.status(400).json({ ok: false, msg: err.message });
            }
            passwordPlana = password;
        } else {
            passwordPlana = crypto.randomBytes(16).toString('hex') + 'Aa1!';
        }

        const salt = bcrypt.genSaltSync();
        const passwordHasheada = bcrypt.hashSync(passwordPlana, salt);
        const config = await ConfiguracionSeguridad.findOne({ where: { activo: true } });
        if (!config) {
            return res.status(500).json({ ok: false, msg: 'No hay configuración de seguridad registrada' });
        }
        const fecha_expiracion = new Date();
        fecha_expiracion.setDate(fecha_expiracion.getDate() + config.vida_util_password_dias);

        const usuario = await Usuario.create({
            nombre,
            apellido_paterno,
            apellido_materno,
            email,
            password: passwordHasheada,
            fecha_nacimiento,
            id_rol: id_rol || null,
            id_parroquia: id_parroquia || null,
            fecha_ultimo_cambio_password: new Date(),
            fecha_expiracion_password: fecha_expiracion
        });

        if (id_parroquia) {
          const rolAsignacion = rolExiste?.nombre || 'SIN_ROL';

          await UsuarioParroquia.create({
            id_usuario: usuario.id_usuario,
            id_parroquia,
            rol_en_parroquia: rolAsignacion,
            activo: true,
          });
        }

        await guardarEnHistorial(usuario.id_usuario, passwordHasheada);
        const usuarioConRol = await Usuario.findByPk(usuario.id_usuario, {
            include: [{ model: Rol, as: 'rol', attributes: ['id_rol', 'nombre'] }]
        });

        const token = await generarJWT(usuario.id_usuario, usuario.email);
        res.status(201).json({
            ok: true,
            usuario: {
                id_usuario: usuarioConRol.id_usuario,
                nombre: usuarioConRol.nombre,
                apellido_paterno: usuarioConRol.apellido_paterno,
                apellido_materno: usuarioConRol.apellido_materno,
                email: usuarioConRol.email,
                fecha_nacimiento: usuarioConRol.fecha_nacimiento,
                activo: usuarioConRol.activo,
                rol: usuarioConRol.rol
            },
            token
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ ok: false, msg: 'Hable con el administrador' });
    }
};



// const loginUsuario = async (req, res) => {
//     const { email, password, turnstileToken } = req.body;

//     try {
//       const captchaResult = await verifyTurnstileToken({
//         token: turnstileToken,
//         remoteip: req.ip
//       });

//       if (!captchaResult.ok) {
//         return res.status(400).json({
//           ok: false,
//           msg: captchaResult.msg,
//           errors: captchaResult.errors || []
//         });
//       }

//       const usuario = await Usuario.findOne({ where: { email, activo: true } });
//       if (!usuario) {
//         return res.status(400).json({ ok: false, msg: 'Usuario no existe' });
//       }

//       if (!usuario.activo) {
//         return res.status(400).json({ ok: false, msg: 'El usuario está inactivo' });
//       }

//       const valid = bcrypt.compareSync(password, usuario.password);
//       if (!valid) {
//         return res.status(400).json({ ok: false, msg: 'Contraseña incorrecta' });
//       }

//       const token = await generarJWT(usuario.id_usuario, usuario.email);

//       res.json({
//         ok: true,
//         uid: usuario.id_usuario,
//         email: usuario.email,
//         nombre: usuario.nombre,
//         rol: usuario.rol,
//         token
//       });
//     } catch (err) {
//       console.error(err);
//       res.status(500).json({ ok: false, msg: 'Hable con el administrador' });
//     }
// };


//Login sin captcha
const loginUsuario = async (req, res) => {
  const { email, password } = req.body;

  try {
    const usuario = await Usuario.findOne({
      where: { email, activo: true },
      include: [{
        model: Rol,
        as: 'rol',
        attributes: ['id_rol', 'nombre']
      }]
    });

    if (!usuario) {
      return res.status(400).json({ ok: false, msg: 'Usuario no existe' });
    }

    const bloqueo = await verificarBloqueo(usuario);
    if (bloqueo.bloqueado) {
      return res.status(403).json({ ok: false, msg: bloqueo.msg });
    }

    const valid = bcrypt.compareSync(password, usuario.password);
    if (!valid) {
      const intento = await registrarIntentoFallido(usuario);
      return res.status(400).json({ ok: false, msg: intento.msg });
    }

    const expiracion = verificarExpiracion(usuario);
    if (expiracion.expirada) {
      return res.status(403).json({
        ok: false,
        msg: expiracion.msg,
        passwordExpirada: true
      });
    }

    const config = await ConfiguracionSeguridad.findOne({
      where: { activo: true }
    });

    const usa2FA = config?.usa_2fa === true;

    if (usa2FA) {
      const codigo = generarCodigo2FA();

      const token2FA = await generarToken2FA({
        uid: usuario.id_usuario,
        email: usuario.email,
        codigo,
        tipo: '2fa'
      });

      const appName = process.env.APP_NAME || 'Sacramentos';

      const emailData = twoFactorEmail({
        appName,
        codigo,
        minutes: 10
      });

      await sendMail({
        to: usuario.email,
        subject: emailData.subject,
        text: emailData.text,
        html: emailData.html
      });

      return res.json({
        ok: true,
        requiere2FA: true,
        token2FA,
        msg: 'Se envió un código de verificación al correo del usuario'
      });
    }

    await resetearIntentos(usuario);

    const token = await generarJWT(usuario.id_usuario, usuario.email);

    res.json({
      ok: true,
      requiere2FA: false,
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
const verificarCodigo2FA = async (req, res) => {
  const { token2FA, codigo } = req.body;

  try {
    if (!token2FA || !codigo) {
      return res.status(400).json({
        ok: false,
        msg: 'El token temporal y el código son obligatorios'
      });
    }

    const data = verificarToken2FA(token2FA);

    if (!data || data.tipo !== '2fa') {
      return res.status(401).json({
        ok: false,
        msg: 'El código expiró. Vuelve a iniciar sesión'
      });
    }

    if (data.codigo !== codigo) {
      return res.status(400).json({
        ok: false,
        msg: 'Código incorrecto'
      });
    }

    const usuario = await Usuario.findOne({
      where: {
        id_usuario: data.uid,
        email: data.email,
        activo: true
      },
      include: [{
        model: Rol,
        as: 'rol',
        attributes: ['id_rol', 'nombre']
      }]
    });

    if (!usuario) {
      return res.status(400).json({
        ok: false,
        msg: 'Usuario no válido'
      });
    }

    await resetearIntentos(usuario);

    const token = await generarJWT(usuario.id_usuario, usuario.email);

    res.json({
      ok: true,
      requiere2FA: false,
      uid: usuario.id_usuario,
      email: usuario.email,
      nombre: usuario.nombre,
      rol: usuario.rol,
      token
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({
      ok: false,
      msg: 'Error al verificar el código 2FA'
    });
  }
};
const revalidarToken = async (req, res) => {
    const { uid, email } = req;
    if (!uid || !email) {
        return res.status(400).json({ ok: false, msg: 'Faltan datos del usuario' });
    }

    try {
        const token = await generarJWT(uid, email);
        res.json({ ok: true, uid, email, token });
    } catch (error) {
        console.error(error);
        res.status(500).json({ ok: false, msg: 'Error al generar el token' });
    }
};


//Funcion para editar al usuario
const actualizarUsuario = async (req, res = response) => {
    const { id } = req.params;
    const { nombre, apellido_paterno, apellido_materno, email, password, fecha_nacimiento, id_rol, id_parroquia } = req.body;
    try {
        const usuario = await Usuario.findOne({ where: { id_usuario: id, activo: true } });
        if (!usuario) {
            return res.status(404).json({ ok: false, msg: 'Usuario no encontrado' });
        }

        if (email && email !== usuario.email) {
            const yaExiste = await Usuario.findOne({ where: { email } });
            if (yaExiste) return res.status(400).json({ ok: false, msg: 'El email ya está en uso' });
        }

        if (id_rol !== undefined && id_rol !== null) {
            const rolExiste = await Rol.findByPk(id_rol);
            if (!rolExiste) {
                return res.status(400).json({ ok: false, msg: 'El rol especificado no existe' });
            }
        }
          if (id_parroquia !== undefined) { 
            if (id_parroquia !== null && id_parroquia !== '') {
              const parroquiaExiste = await Parroquia.findByPk(id_parroquia);
              if (!parroquiaExiste) {
                  return res.status(400).json({ ok: false, msg: 'La parroquia especificada no existe' });
              }
            } 
          }


        const updates = {};
        if (nombre !== undefined) updates.nombre = nombre;
        if (apellido_paterno !== undefined) updates.apellido_paterno = apellido_paterno;
        if (apellido_materno !== undefined) updates.apellido_materno = apellido_materno;
        if (email !== undefined) updates.email = email;
        if (fecha_nacimiento !== undefined) updates.fecha_nacimiento = fecha_nacimiento;
        if (id_rol !== undefined) updates.id_rol = id_rol;

        if (password) {
            try {
                await passwordFuerte(password);
            } catch (err) {
                return res.status(400).json({ ok: false, msg: err.message });
            }

            // Verifica historial para que no se repita
            const historial = await verificarHistorial(usuario.id_usuario, password);
            if (!historial.ok) {
                return res.status(400).json({ ok: false, msg: historial.msg });
            }
            const salt = bcrypt.genSaltSync();
            const passwordHasheada = bcrypt.hashSync(password, salt);

            const config = await ConfiguracionSeguridad.findOne({ where: { activo: true } });
            if (!config) {
                return res.status(500).json({ ok: false, msg: 'No hay configuración de seguridad registrada' });
            }
            const fecha_expiracion = new Date();
            fecha_expiracion.setDate(fecha_expiracion.getDate() + config.vida_util_password_dias);

            updates.password = passwordHasheada;
            updates.fecha_ultimo_cambio_password = new Date();
            updates.fecha_expiracion_password = fecha_expiracion;

            await guardarEnHistorial(usuario.id_usuario, passwordHasheada);
        }

        await usuario.update(updates);

        //para la parroquia
        if (id_parroquia !== undefined) {
          if (id_parroquia !== null && id_parroquia !== '') {
            const parroquiaExiste = await Parroquia.findByPk(id_parroquia);

            if (!parroquiaExiste) {
              return res.status(400).json({
                ok: false,
                msg: 'La parroquia especificada no existe'
              });
            }

            const rolActual = id_rol
              ? await Rol.findByPk(id_rol)
              : await Rol.findByPk(usuario.id_rol);

            await UsuarioParroquia.update(
              {
                activo: false,
                fecha_fin: new Date()
              },
              {
                where: {
                  id_usuario: usuario.id_usuario,
                  activo: true
                }
              }
            );

            await UsuarioParroquia.create({
              id_usuario: usuario.id_usuario,
              id_parroquia: Number(id_parroquia),
              rol_en_parroquia: rolActual?.nombre || 'SIN_ROL',
              activo: true
            });
          } else {
            await UsuarioParroquia.update(
              {
                activo: false,
                fecha_fin: new Date()
              },
              {
                where: {
                  id_usuario: usuario.id_usuario,
                  activo: true
                }
              }
            );
          }
        }
        const usuarioActualizado = await Usuario.findByPk(id, {
            include: [{ model: Rol, as: 'rol', attributes: ['id_rol', 'nombre'] }]
        });

        const { password: _, ...usuarioPlano } = usuarioActualizado.get({ plain: true });
        res.json({ ok: true, usuario: usuarioPlano });

    } catch (e) {
        console.error('Error al actualizar el usuario:', e);
        res.status(500).json({ ok: false, msg: 'Error al actualizar el usuario' });
    }
};


// Eliminado lógico de un usuario
const eliminarUsuario = async (req, res = response) => {
    const { id } = req.params;
    try {
        const usuario = await Usuario.findOne({ where: { id_usuario: id, activo: true } });
        if (!usuario) {
            return res.status(404).json({ ok: false, msg: 'Usuario no encontrado' });
        }

        await usuario.update({ activo: false });

        await UsuarioParroquia.update(
          {
            activo: false,
            fecha_fin: new Date()
          },
          {
            where: {
              id_usuario: id,
              activo: true
            }
          }
        );
        res.json({ ok: true, msg: 'Usuario eliminado correctamente' });
    } catch (error) {
        console.error('Error al eliminar el usuario:', error);
        res.status(500).json({ ok: false, msg: 'Error al eliminar el usuario' });
    }
};

const desbloquearUsuario = async (req, res) => {
  const { id } = req.params;

  try {
    const usuario = await Usuario.findOne({
      where: { id_usuario: id }
    });

    if (!usuario) {
      return res.status(404).json({
        ok: false,
        msg: 'Usuario no encontrado'
      });
    }

    await resetearIntentos(usuario);

    try {
      if (usuario.email) {
        const appName = process.env.APP_NAME || 'Sacramentos';

        const tpl = cuentaDesbloqueadaEmail({
          appName,
          nombre: usuario.nombre
        });

        await sendMail({
          to: usuario.email,
          subject: tpl.subject,
          text: tpl.text,
          html: tpl.html
        });
      }
    } catch (mailError) {
      console.warn(
        'No se pudo enviar correo de desbloqueo:',
        mailError?.message || mailError
      );
    }

    return res.json({
      ok: true,
      msg: 'Usuario desbloqueado correctamente'
    });

  } catch (error) {
    console.error('Error al desbloquear el usuario:', error);
    return res.status(500).json({
      ok: false,
      msg: 'Error al desbloquear el usuario'
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
    getAllUsuarios,
    verificarCodigo2FA,
    desbloquearUsuario
  };