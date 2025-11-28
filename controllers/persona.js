const { response } = require('express');
const Persona = require('../models/Persona');
const PersonaSacramento = require('../models/PersonaSacramento');
const RolSacramento = require('../models/RolSacramento');
const requisitos = require('./utils/sacramentos');
const { combinarCondiciones } = require('../middlewares/busqueda');
const { Op } = require('sequelize');

const getPersonas = async (req, res = response) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const offset = (page - 1) * limit;
        
        const { 
            search,
            nombre,
            apellido_paterno,
            apellido_materno,
            carnet_identidad,
            fecha_nacimiento,
            lugar_nacimiento,
            nombre_padre,
            nombre_madre,
            estado,
            activo
        } = req.query;
  

        const camposBusqueda = [
            'nombre',
            'apellido_paterno',
            'apellido_materno',
            'carnet_identidad',
            'fecha_nacimiento',
            'lugar_nacimiento',
            'nombre_padre',
            'nombre_madre',
            'estado'
        ];
        

        const filtros = {
            nombre,
            apellido_paterno,
            apellido_materno,
            carnet_identidad,
            fecha_nacimiento,
            lugar_nacimiento,
            nombre_padre,
            nombre_madre,
            estado,
            activo: activo !== undefined ? activo : true 
        };
        
        let whereConditions = combinarCondiciones(search, camposBusqueda, filtros);

        // Permitir búsqueda parcial y case-insensitive por carnet_identidad si no hay 'search'
        if (carnet_identidad && !search) {
            whereConditions = {
                ...whereConditions,
                carnet_identidad: { [Op.iLike]: `%${carnet_identidad}%` }
            };
        }

        const { count, rows } = await Persona.findAndCountAll({
            where: whereConditions,
            offset,
            limit,
            order: [['apellido_paterno', 'ASC'], ['apellido_materno', 'ASC'], ['nombre', 'ASC']]
        });

        res.json({
            ok: true,
            personas: rows,
            totalItems: count,
            totalPages: Math.ceil(count / limit),
            currentPage: page,
            filtros_aplicados: {
                search,
                nombre,
                apellido_paterno,
                apellido_materno,
                carnet_identidad,
                fecha_nacimiento,
                lugar_nacimiento,
                nombre_padre,
                nombre_madre,
                estado,
                activo
            }
        });
    } catch (error) {
        console.error('Error en getPersonas:', error);
        res.status(500).json({
            ok: false,
            msg: 'Error al obtener las personas',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
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



// Obtener una persona por ID
const getPersona = async (req, res) => {
    const { id } = req.params;
    try {
      const persona = await Persona.findOne({
        where: { id_persona: id, activo: true }
      });
      if (!persona) {
        return res.status(404).json({ ok: false, msg: 'Persona no encontrada' });
      }
      res.json({ ok: true, persona });
    } catch (err) {
      console.error(err);
      res.status(500).json({ ok: false, msg: 'Error al obtener persona' });
    }
  };
  
  const revalidarToken = async (req, res) => {
    const { uid, email } = req; // Accede directamente desde req

    if (!uid || !email) {
        return res.status(400).json({
            ok: false,
            msg: 'Faltan datos de la persona'
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

//Funcion para editar a la persona
const actualizarPersona = async (req, res) => {
  const id = Number(req.params.id);
  if (Number.isNaN(id)) {
    return res.status(400).json({ ok:false, msg:'ID inválido' });
  }

  const {
    nombre,
    apellido_paterno,
    apellido_materno,
    carnet_identidad,
    fecha_nacimiento,
    lugar_nacimiento,
    nombre_padre,
    nombre_madre,
    estado,
    activo
  } = req.body;

  try {
    const persona = await Persona.findOne({
      where: { id_persona: id }
    });

    if (!persona) {
      return res.status(404).json({ ok:false, msg:'Persona no encontrada' });
    }

    if (carnet_identidad && carnet_identidad !== persona.carnet_identidad) {
      const yaExiste = await Persona.findOne({ where: { carnet_identidad } });
      if (yaExiste) {
        return res.status(400).json({ ok:false, msg:'El carnet de identidad ya está en uso' });
      }
    }
    const updates = {};
    if (nombre !== undefined) updates.nombre = nombre;
    if (apellido_paterno !== undefined) updates.apellido_paterno = apellido_paterno;
    if (apellido_materno !== undefined) updates.apellido_materno = apellido_materno;
    if (carnet_identidad !== undefined) updates.carnet_identidad = carnet_identidad;
    if (fecha_nacimiento !== undefined) updates.fecha_nacimiento = fecha_nacimiento; // YYYY-MM-DD
    if (lugar_nacimiento !== undefined) updates.lugar_nacimiento = lugar_nacimiento;
    if (nombre_padre !== undefined) updates.nombre_padre = nombre_padre;
    if (nombre_madre !== undefined) updates.nombre_madre = nombre_madre;
    if (estado !== undefined) updates.estado = estado;
    if (activo !== undefined) updates.activo = activo;

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ ok:false, msg:'No se enviaron campos a actualizar' });
    }

    const personaActualizada = await persona.update(updates);

    return res.json({
      ok: true,
      persona: personaActualizada.get({ plain: true })
    });

  } catch (e) {
    console.error('Error al actualizar la persona:', e);
    return res.status(500).json({ ok:false, msg:'Error al actualizar la persona' });
  }
};


// Eliminado lógico de un persona
const eliminarPersona = async (req, res = response) => {
    const { id } = req.params;

    try {
        const persona = await Persona.findOne({
            where: { id_persona: id, activo: true }
        });

        if (!persona) {
            return res.status(404).json({
                ok: false,
                msg: 'Persona no encontrada'
            });
        }

        await persona.update({ activo: false });

        res.json({
            ok: true,
            msg: 'Persona eliminada correctamente'
        });
    } catch (error) {
        console.error('Error al eliminar el usuario:', error);
        res.status(500).json({
            ok: false,
            msg: 'Error al eliminar el usuario'
        });
    }
};

//intento endpoint para todos los sacramentos 

const buscarPersonasParaSacramento = async (req, res) => {
  try {
    let { search, rol: sacramento } = req.query;

    if (!search || !sacramento)
      return res.status(400).json({ ok: false, msg: "Faltan parámetros" });

    // Normalizar a minúsculas
    sacramento = sacramento.toLowerCase();

    // Buscar clave real del archivo requisitos (insensible a mayúsculas)
    const clave = Object.keys(requisitos).find(
      (key) => key.toLowerCase() === sacramento
    );

    if (!clave)
      return res.status(400).json({ ok: false, msg: "Sacramento inválido" });

    const regla = requisitos[clave];

    // 1. Buscar personas por nombre/CI
    const personas = await Persona.findAll({
      where: {
        activo: true,
        [Op.or]: [
          { nombre: { [Op.iLike]: `%${search}%` } },
          { apellido_paterno: { [Op.iLike]: `%${search}%` } },
          { apellido_materno: { [Op.iLike]: `%${search}%` } },
          { carnet_identidad: { [Op.iLike]: `%${search}%` } }
        ]
      },
      include: [
        {
          model: PersonaSacramento,
          as: "personaSacramentos",
          include: [
            {
              model: RolSacramento,
              as: "rolSacramento",
              attributes: ["nombre"]
            }
          ],
          required: false
        }
      ]
    });

    // 2. Filtrar por reglas del sacramento
    const resultado = personas.filter((p) => {
        const roles = p.personaSacramentos.map(r => r.rolSacramento.nombre);
      

        console.log("----");
        console.log("Persona:", p.nombre, p.apellido_paterno);
        console.log("Roles:", roles);
        console.log("Regla requerida:", regla.requeridos);
        console.log("Regla excluir:", regla.excluir);

        const cumpleRequeridos = regla.requeridos.every(req => roles.includes(req));
        const noTieneExcluidos = !regla.excluir.some(ex => roles.includes(ex));
      

      return cumpleRequeridos && noTieneExcluidos;
    });

    res.json({ ok: true, personas: resultado });

  } catch (error) {
    console.error(error);
    res.status(500).json({ ok: false, msg: "Error en búsqueda" });
  }
};

  module.exports = {
    getPersonas,
    crearPersona,
    getPersona,
    actualizarPersona,
    eliminarPersona,
    getAllPersonas,
    buscarPersonasParaSacramento
  };