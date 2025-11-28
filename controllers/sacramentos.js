const { response } = require('express');
const Sacramento = require('../models/Sacramento');
const TipoSacramento = require('../models/TipoSacramento');  
const Parroquia = require('../models/Parroquia');           
const Usuario = require('../models/Usuario');
const PersonaSacramento = require('../models/PersonaSacramento');
const { combinarCondiciones } = require('../middlewares/busqueda');


// Obtener todos los sacramentos activos
const getSacramentos = async (req, res = response) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const offset = (page - 1) * limit;
        
        const { 
            search,
            fecha_sacramento,
            fecha_registro,
            fecha_actualizacion,
            activo,
            foja,
            numero,
            usuario_id_usuario,
            institucion_parroquia_id_parroquia,
            tipo_sacramento_id_tipo
        } = req.query;
  
        const camposBusqueda = [
            'foja'  
        ];
        
        const filtros = {
            fecha_sacramento,           
            fecha_registro,
            fecha_actualizacion,    
            foja,                       
            numero,                     
            usuario_id_usuario,         
            institucion_parroquia_id_parroquia, 
            tipo_sacramento_id_tipo,    
            activo: activo !== undefined ? activo : true
        };
        
        const whereConditions = combinarCondiciones(search, camposBusqueda, filtros);

        const { count, rows } = await Sacramento.findAndCountAll({
            where: whereConditions,
            include: [
                {
                    model: TipoSacramento,
                    as: 'tipoSacramento',
                    attributes: ['id_tipo', 'nombre', 'descripcion']
                },
                {
                    model: Parroquia,
                    as: 'parroquia',
                    attributes: ['id_parroquia', 'nombre', 'direccion']
                },
                {
                    model: Usuario,
                    as: 'usuario',
                    attributes: ['id_usuario', 'nombre', 'apellido_paterno', 'email']
                }
            ],
            offset,
            limit,
            order: [['fecha_sacramento', 'DESC'], ['numero', 'DESC'], ['fecha_registro', 'DESC'], ['fecha_actualizacion', 'DESC']]
        });

        res.json({
            ok: true,
            sacramentos: rows,
            totalItems: count,
            totalPages: Math.ceil(count / limit),
            currentPage: page,
            filtros_aplicados: {
                search,
                fecha_registro,
                fecha_actualizacion,
                foja,
                numero,
                usuario_id_usuario,
                institucion_parroquia_id_parroquia,
                tipo_sacramento_id_tipo,
                activo
            }
        });

    } catch (error) {
        console.error('Error en getSacramentos:', error);
        res.status(500).json({
            ok: false,
            msg: 'Error al obtener los sacramentos',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
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

// endpoint para crear sacramento y todas sus relaciones
const crearSacramentoCompleto = async (req, res) => {
  const t = await Sacramento.sequelize.transaction();
  try {
    const {
      fecha_sacramento,
      foja,
      numero,
      tipo_sacramento_id_tipo,
      parroquiaId,
      relaciones
    } = req.body;

    // usuario autenticado
    const usuario_id_usuario = req.uid; // VIENE DEL JWT

    if (!req.uid) {
      return res.status(400).json({ ok: false, msg: "Usuario no autenticado" });
    }

    if (!relaciones || !Array.isArray(relaciones)) {
      return res.status(400).json({ ok: false, msg: "Formato inválido en relaciones" });
    }

    // 1️⃣ Crear sacramento
    const nuevo = await Sacramento.create({
      fecha_sacramento,
      foja,
      numero,
      tipo_sacramento_id_tipo,
      institucion_parroquia_id_parroquia: parroquiaId,
      usuario_id_usuario,               // 👈 ahora viene del JWT
      activo: true,
      fecha_registro: new Date(),       // opcional, igual se llena solo
      fecha_actualizacion: new Date()   // 👈 importante
    }, { transaction: t });

    const id_sacramento = nuevo.id_sacramento;

    // 2️⃣ Registrar TODAS las relaciones dinámicas
    // Crear relaciones en persona_sacramento
    for (const rel of relaciones) {
      await PersonaSacramento.create({
        persona_id_persona: rel.persona_id,
        rol_sacramento_id_rol_sacra: rel.rol_sacramento_id,
        sacramento_id_sacramento: id_sacramento
      }, { transaction: t });
    }

    // 3️⃣ Confirmar transacción
    await t.commit();

    return res.status(201).json({
      ok: true,
      msg: "Sacramento creado correctamente",
      sacramento: nuevo
    });

  } catch (error) {
    await t.rollback();
    console.error("Error al crear sacramento completo:", error);
    return res.status(500).json({ ok: false, msg: "Error al crear sacramento" });
  }
};

  module.exports = {
    getSacramentos,
    crearSacramento,
    getSacramento,
    actualizarSacramento,
    eliminarSacramento,
    getAllSacramentos,
    crearSacramentoCompleto
  };