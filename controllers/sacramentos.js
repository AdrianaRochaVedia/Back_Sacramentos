const { response } = require('express');
const Sacramento = require('../models/Sacramento');
const TipoSacramento = require('../models/TipoSacramento');  
const Parroquia = require('../models/Parroquia');           
const Usuario = require('../models/Usuario');
const PersonaSacramento = require('../models/PersonaSacramento');
const Persona = require('../models/Persona');
const RolSacramento = require('../models/RolSacramento');
const { Op } = require('sequelize');
const { combinarCondiciones } = require('../middlewares/busqueda');
const MatrimonioDetalle = require('../models/MatrimonioDetalle');
const {
  crearSacramentoCompletoService,
  actualizarSacramentoCompletoService,
} = require('../services/sacramento.service');
const {
  indexarSacramento,
  buscarPorTextoLibre,
  buscarPorPersonaYTipo,
  opensearchConfigurado
} = require('../services/opensearch.service'); // <-- AGREGADO

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
        
        // Usamos tu middleware existente para las condiciones base de SQL
        const camposBusqueda = ['foja'];
        let whereConditions = combinarCondiciones(undefined, camposBusqueda, filtros); // Pasamos undefined al search para que SQL no haga el Op.like lento

        // ==========================================
        // INTEGRACIÓN OPENSEARCH PARA BÚSQUEDA LIBRE
        // ==========================================
        if (search && search.trim() !== '') {
            const { fuente, ids } = await buscarPorTextoLibre(search.trim());

            if (fuente === 'opensearch') {
                // Si OpenSearch no encuentra nada con ese texto, devolvemos vacío inmediatamente
                if (ids.length === 0) {
                    return res.json({
                        ok: true,
                        sacramentos: [],
                        totalItems: 0,
                        totalPages: 0,
                        currentPage: page,
                        filtros_aplicados: { search, ...filtros },
                        motor_busqueda: 'opensearch'
                    });
                }

                // Extraemos los IDs que OpenSearch encontró y forzamos a Sequelize a buscar SOLO esos
                whereConditions.id_sacramento = { [Op.in]: ids };

            } else {
                // OpenSearch no disponible o con error: buscamos directamente en Postgres
                console.log('[Busqueda] Usando PostgreSQL para búsqueda de texto libre.');
                const likeSearch = { [Op.iLike]: `%${search.trim()}%` };
                whereConditions = {
                    ...whereConditions,
                    [Op.or]: [
                        { foja: likeSearch },
                        { numero: likeSearch }
                    ]
                };
            }
        }
        // ==========================================

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
            order: [['fecha_sacramento', 'DESC'], ['numero', 'DESC'], ['fecha_registro', 'DESC']]
        });

        res.json({
            ok: true,
            sacramentos: rows,
            totalItems: count,
            totalPages: Math.ceil(count / limit),
            currentPage: page,
            filtros_aplicados: { search, ...filtros },
            motor_busqueda: search ? (opensearchConfigurado() ? 'opensearch' : 'postgresql') : 'postgresql'
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
  const { 
    fecha_sacramento, 
    foja, 
    numero, 
    usuario_id_usuario, 
    institucion_parroquia_id_parroquia, 
    tipo_sacramento_id_tipo 
  } = req.body;

  try {
    const sacramento = await Sacramento.create({
      fecha_sacramento,
      foja,
      numero,
      usuario_id_usuario,
      institucion_parroquia_id_parroquia,
      tipo_sacramento_id_tipo
    });

    // =================================================================
    // ENLACE CON AWS OPENSEARCH - CREACIÓN SIMPLE
    // =================================================================
    await indexarSacramento({
      id_sacramento:      sacramento.id_sacramento,
      foja,
      numero,
      fecha_sacramento,
      tipo_sacramento_id: tipo_sacramento_id_tipo,
      parroquia_id:       institucion_parroquia_id_parroquia,
      texto_ocr:          '', // Inicialmente vacío en creación simple
      personas_involucradas: '' // Al ser un registro simple no cuenta con el array de relaciones estructuradas
    });
    // =================================================================

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

    res.locals._instancia = sacramento;
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

        res.locals._instancia = sacramento;
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


const crearSacramentoCompleto = async (req, res) => {
  const t = await Sacramento.sequelize.transaction();

  try {
    const usuario_id_usuario = req.uid;

    if (!usuario_id_usuario) {
      await t.rollback();
      return res.status(401).json({
        ok: false,
        msg: 'Usuario no autenticado',
      });
    }

    // Llama a tu servicio pasándole los datos limpios
    const sacramento = await crearSacramentoCompletoService({
      data: req.body,
      usuario_id_usuario,
      transaction: t,
    });

    await t.commit();

    // =================================================================
    // ENLACE CON AWS OPENSEARCH - CREACIÓN MANUAL
    // =================================================================
    const { foja, numero, fecha_sacramento, tipo_sacramento_id_tipo, parroquiaId, relaciones } = req.body;

    // Unimos los nombres del array de relaciones para que el buscador global los localice directamente
    const nombresInvolucrados = relaciones && Array.isArray(relaciones)
      ? relaciones.map(r => r.nombre_completo || r.nombre || '').join(' ')
      : '';

    const personasDB = await PersonaSacramento.findAll({
      where: { sacramento_id_sacramento: sacramento.id_sacramento },
      include: [{ model: Persona, as: 'persona', attributes: ['carnet_identidad'] }]
    });
    const carnetsInvolucrados = personasDB
      .map(ps => (ps.persona?.carnet_identidad || '').trim().toLowerCase())
      .filter(Boolean);

    await indexarSacramento({
      id_sacramento:         sacramento.id_sacramento,
      foja,
      numero,
      fecha_sacramento,
      tipo_sacramento_id:    tipo_sacramento_id_tipo,
      parroquia_id:          parroquiaId,
      texto_ocr:             '',
      personas_involucradas: nombresInvolucrados.trim(),
      carnets_involucrados:  carnetsInvolucrados
    });
    // =================================================================

    return res.status(201).json({
      ok: true,
      msg: 'Sacramento creado correctamente',
      sacramento,
    });
  } catch (error) {
    await t.rollback();
    console.error('Error al crear sacramento completo:', error);
    return res.status(400).json({
      ok: false,
      msg: error.message || 'Error al crear sacramento',
    });
  }
};


const buscarSacramentosPorPersona = async (req, res) => {
  try {
    const {
      nombre,
      apellido_paterno,
      apellido_materno,
      ci,
      carnet_identidad,
      tipo_sacramento_id_tipo,
      rol_sacramento_id_rol_sacra,
      page = 1,
      limit = 10
    } = req.query;

    if (!tipo_sacramento_id_tipo) {
      return res.status(400).json({ ok: false, msg: "Debe enviar tipo_sacramento_id_tipo" });
    }

    // Filtros de persona y rol que se aplican en PostgreSQL (en ambos caminos)
    const wherePersona = {};
    if (nombre)            wherePersona.nombre            = { [Op.iLike]: `%${nombre}%` };
    if (apellido_paterno)  wherePersona.apellido_paterno  = { [Op.iLike]: `%${apellido_paterno}%` };
    if (apellido_materno)  wherePersona.apellido_materno  = { [Op.iLike]: `%${apellido_materno}%` };

    const wherePS = {};
    if (rol_sacramento_id_rol_sacra) {
      wherePS.rol_sacramento_id_rol_sacra = Number(rol_sacramento_id_rol_sacra);
    }

    // ==========================================
    // 1. BUSCAR EN OPENSEARCH PRIMERO
    // ==========================================
    // Juntamos los nombres y apellidos en una sola cadena de búsqueda difusa
    let textoPersona = `${nombre || ''} ${apellido_paterno || ''} ${apellido_materno || ''}`.trim();
    const documentoIdentidad = ci || carnet_identidad;

    if (documentoIdentidad) wherePersona.carnet_identidad = { [Op.iLike]: `%${documentoIdentidad}%` };

    const { fuente, ids, total } = await buscarPorPersonaYTipo({
      tipo_sacramento_id: tipo_sacramento_id_tipo,
      textoPersona,
      documentoIdentidad: documentoIdentidad || '',
      page:  Number(page),
      limit: Number(limit)
    });

    // Si OpenSearch no esta disponible, o devolvió 0 resultados buscando por carnet
    // (puede pasar si los datos no están sincronizados), hacemos la búsqueda en Postgres.
    const usarPostgres =
      fuente === 'no_disponible' ||
      fuente === 'error' ||
      (ids.length === 0 && !!documentoIdentidad);

    if (usarPostgres) {
      console.log('[Busqueda] Búsqueda por persona realizada directamente en PostgreSQL.');

      const offset = (Number(page) - 1) * Number(limit);

      const rows = await Sacramento.findAll({
        where: { tipo_sacramento_id_tipo: Number(tipo_sacramento_id_tipo), activo: true },
        include: [
          {
            model: PersonaSacramento,
            as: "personaSacramentos",
            required: true,
            where: Object.keys(wherePS).length > 0 ? wherePS : undefined,
            include: [{
              model: Persona,
              as: "persona",
              required: Object.keys(wherePersona).length > 0,
              where: Object.keys(wherePersona).length > 0 ? wherePersona : undefined
            }]
          },
          { model: TipoSacramento, as: "tipoSacramento" },
          { model: Parroquia, as: "parroquia" },
        ],
        order: [['fecha_sacramento', 'DESC'], ['numero', 'DESC']],
        limit: Number(limit),
        offset
      });

      for (const s of rows) {
        const relaciones = await PersonaSacramento.findAll({
          where: { sacramento_id_sacramento: s.id_sacramento },
          include: [
            { model: Persona, as: "persona" },
            { model: RolSacramento, as: "rolSacramento" }
          ]
        });
        s.dataValues.todasRelaciones = relaciones;

        if (s.tipoSacramento?.id_tipo === 2) {
          const matrimonioDetalle = await MatrimonioDetalle.findOne({
            where: { sacramento_id_sacramento: s.id_sacramento }
          });
          s.dataValues.matrimonioDetalle = matrimonioDetalle;
        } else {
          s.dataValues.matrimonioDetalle = null;
        }
      }

      return res.json({
        ok: true,
        resultados: rows,
        total: rows.length,
        totalPages: Math.ceil(rows.length / Number(limit)),
        currentPage: Number(page),
        motor_busqueda: 'postgresql'
      });
    }
    // ==========================================

    // ==========================================
    // 2. RECUPERAR DATOS COMPLETOS DE POSTGRES (cuando OpenSearch respondió con resultados)
    // ==========================================
    if (ids.length === 0) {
      return res.json({
        ok: true,
        resultados: [],
        total: 0,
        totalPages: 0,
        currentPage: Number(page),
        motor_busqueda: 'opensearch'
      });
    }

    // Filtramos por IDs de OpenSearch + rol/persona en PostgreSQL
    const rows = await Sacramento.findAll({
      where: {
        id_sacramento: ids,
        activo: true
      },
      include: [
        {
          model: PersonaSacramento,
          as: "personaSacramentos",
          required: true,
          where: Object.keys(wherePS).length > 0 ? wherePS : undefined,
          include: [{
            model: Persona,
            as: "persona",
            required: Object.keys(wherePersona).length > 0,
            where: Object.keys(wherePersona).length > 0 ? wherePersona : undefined
          }]
        },
        { model: TipoSacramento, as: "tipoSacramento" },
        { model: Parroquia, as: "parroquia" },
      ],
      order: [
        ['fecha_sacramento', 'DESC'],
        ['numero', 'DESC']
      ]
    });

    // Mantenemos tu lógica de mapeo de detalles y relaciones
    for (const s of rows) {
      const relaciones = await PersonaSacramento.findAll({
        where: { sacramento_id_sacramento: s.id_sacramento },
        include: [
          { model: Persona, as: "persona" },
          { model: RolSacramento, as: "rolSacramento" }
        ]
      });

      s.dataValues.todasRelaciones = relaciones;

      if (s.tipoSacramento?.id_tipo === 2) {
        const matrimonioDetalle = await MatrimonioDetalle.findOne({
          where: { sacramento_id_sacramento: s.id_sacramento }
        });
        s.dataValues.matrimonioDetalle = matrimonioDetalle;
      } else {
        s.dataValues.matrimonioDetalle = null;
      }
    }

    return res.json({
      ok: true,
      resultados: rows,
      total,
      totalPages: Math.ceil(total / Number(limit)),
      currentPage: Number(page),
      motor_busqueda: 'opensearch'
    });

  } catch (error) {
    console.error("Error en buscarSacramentosPorPersona:", error);
    res.status(500).json({
      ok: false,
      msg: "Error al realizar la búsqueda",
      error: error.message
    });
  }
};
// para identificar candidatos a sacerdote
const buscarPersonasConTodosLosSacramentos = async (req, res) => {
  try {
    // IDs de tipos de sacramento
    const ID_BAUTIZO = 1;
    const ID_COMUNION = 3;
    const ID_MATRIMONIO = 2;

    const {
      sacerdote = "false",
      search,
      nombre,
      apellido_paterno,
      apellido_materno,
      ci,
      carnet_identidad,
      id_persona
    } = req.query;

    // Personas bautizadas
    const bautizados = await PersonaSacramento.findAll({
      where: { rol_sacramento_id_rol_sacra: 1 },
      include: [{
        model: Sacramento,
        as: "sacramento",
        where: { tipo_sacramento_id_tipo: ID_BAUTIZO, activo: true }
      }]
    });

    // Personas confirmadas (Primera Comunión)
    const confirmados = await PersonaSacramento.findAll({
      where: { rol_sacramento_id_rol_sacra: 10 },
      include: [{
        model: Sacramento,
        as: "sacramento",
        where: { tipo_sacramento_id_tipo: ID_COMUNION, activo: true }
      }]
    });

    // Personas casadas (esposo o esposa)
    const matrimonios = await PersonaSacramento.findAll({
      where: {
        rol_sacramento_id_rol_sacra: {
          [Op.in]: [2, 3] // esposo o esposa
        }
      },
      include: [{
        model: Sacramento,
        as: "sacramento",
        where: { tipo_sacramento_id_tipo: ID_MATRIMONIO, activo: true }
      }]
    });

    // Sets de IDs
    const setBautizo = new Set(bautizados.map(b => b.persona_id_persona));
    const setConfirmado = new Set(confirmados.map(c => c.persona_id_persona));
    const setMatrimonio = new Set(matrimonios.map(m => m.persona_id_persona));

    // Intersección correcta
    const idsFinales = [...setBautizo].filter(
      id => setConfirmado.has(id) && setMatrimonio.has(id)
    );

    // Filtros dinámicos de Persona
    const filtrosPersona = {};

    if (search) {
      const orConditions = [
        { nombre: { [Op.like]: `%${search}%` } },
        { apellido_paterno: { [Op.like]: `%${search}%` } },
        { apellido_materno: { [Op.like]: `%${search}%` } },
        { carnet_identidad: { [Op.like]: `%${search}%` } }
      ];
      // Si search es numérico, buscar también por id_persona exacto
      if (!isNaN(search)) {
        orConditions.push({ id_persona: Number(search) });
      }
      filtrosPersona[Op.or] = orConditions;
    }

    if (nombre) filtrosPersona.nombre = { [Op.like]: `%${nombre}%` };
    if (apellido_paterno) filtrosPersona.apellido_paterno = { [Op.like]: `%${apellido_paterno}%` };
    if (apellido_materno) filtrosPersona.apellido_materno = { [Op.like]: `%${apellido_materno}%` };
    if (ci || carnet_identidad) {
      filtrosPersona.carnet_identidad = { [Op.like]: `%${ci || carnet_identidad}%` };
    }
    if (id_persona) filtrosPersona.id_persona = id_persona;

    // 
    const personas = await Persona.findAll({
      where: {
        id_persona: idsFinales,
        ...(sacerdote === "false" ? { sacerdote: false } : { sacerdote: true }),
        ...filtrosPersona
      },
      order: [
        ['apellido_paterno', 'ASC'],
        ['apellido_materno', 'ASC'],
        ['nombre', 'ASC']
      ]
    });

    return res.json({
      ok: true,
      total: personas.length,
      personas
    });

  } catch (error) {
    console.error("Error en buscarPersonasConTodosLosSacramentos:", error);
    res.status(500).json({
      ok: false,
      msg: "Error al buscar personas con todos los sacramentos",
      error: error.message
    });
  }
};
 
//para obtener los datos del sacramento y las personas relacionadas
// Obtener un sacramento con TODAS sus relaciones para editar
const getSacramentoCompleto = async (req, res) => {
  try {
    // Log de inicio y parámetros
    console.log("getSacramentoCompleto INICIO");
    const { id } = req.params;
    console.log("ID recibido:", id, "tipo:", typeof id);

    const sacramento = await Sacramento.findOne({
      where: { id_sacramento: id, activo: true },
      include: [
        // Roles y personas
        {
          model: PersonaSacramento,
          as: "personaSacramentos",
          include: [
            {
              model: Persona,
              as: "persona"
            },
            {
              model: RolSacramento,
              as: "rol"
            }
          ]
        },
        // Tipo de sacramento
        {
          model: TipoSacramento,
          as: "tipoSacramento"
        },
        // Parroquia
        {
          model: Parroquia,
          as: "parroquia"
        },
        // Usuario
        {
          model: Usuario,
          as: "usuario"
        },
      ]
    });

    // Log después de buscar el sacramento
    console.log("Sacramento encontrado:", !!sacramento);
    if (sacramento) {
      console.log("ID Sacramento:", sacramento.id_sacramento);
      console.log("Tipo Sacramento:", sacramento.tipoSacramento?.id_tipo, "-", sacramento.tipoSacramento?.nombre);
    }

    if (!sacramento) {
      return res.status(404).json({
        ok: false,
        msg: "Sacramento no encontrado"
      });
    }

    // Restructuración para FRONTEND ( EXACTO COMO PARA EDITAR )
    const relaciones = sacramento.personaSacramentos.map(r => ({
      id_relacion: r.id_persona_sacramento,
      persona_id: r.persona.id_persona,
      nombre_completo: `${r.persona.nombre} ${r.persona.apellido_paterno} ${r.persona.apellido_materno}`,
      carnet_identidad: r.carnet_identidad,
      rol_id: r.rol.id_rol_sacra,
      rol_nombre: r.rol.nombre
    }));

    // Log del tipo antes de buscar MatrimonioDetalle
    if (sacramento.tipoSacramento?.id_tipo !== 2) {
      console.log("No es matrimonio, no debería haber detalle");
    }

    // Log antes de buscar MatrimonioDetalle
    console.log("Buscando MatrimonioDetalle con sacramento_id_sacramento =", id);
    const matrimonio_detalle = await MatrimonioDetalle.findOne({
      where: { sacramento_id_sacramento : id },
    });

    // Log del resultado de la búsqueda
    if (matrimonio_detalle) {
      console.log("MatrimonioDetalle ENCONTRADO:", matrimonio_detalle.get({ plain: true }));
    } else {
      console.log("MatrimonioDetalle NO encontrado para id:", id);
    }

    // Log final antes del response
    console.log("Enviando respuesta al frontend");
    console.log("matrimonioDetalle enviado:", matrimonio_detalle);

    res.json({
      ok: true,
      sacramento: {
        id_sacramento: sacramento.id_sacramento,
        fecha_sacramento: sacramento.fecha_sacramento,
        foja: sacramento.foja,
        numero: sacramento.numero,
        parroquia: {
          id: sacramento.parroquia.id_parroquia,
          nombre: sacramento.parroquia.nombre
        },
        tipo_sacramento: {
          id: sacramento.tipoSacramento.id_tipo,
          nombre: sacramento.tipoSacramento.nombre
        },
        usuario_registro: {
          id: sacramento.usuario.id_usuario,
          nombre: sacramento.usuario.nombre
        },
        relaciones,
        matrimonioDetalle: matrimonio_detalle 
      }
    });

  } catch (error) {
    console.error("Error en getSacramentoCompleto:", error);
    res.status(500).json({
      ok: false,
      msg: "Error al obtener sacramento completo"
    });
  }
};
// para editar sacramento y sus relaciones
// PUT - actualizar sacramento completo (datos + relaciones)
const actualizarSacramentoCompleto = async (req, res) => {
  const t = await Sacramento.sequelize.transaction();

  try {
    const usuario_id_usuario = req.uid;
    const id_sacramento = req.params.id;

    if (!usuario_id_usuario) {
      await t.rollback();
      return res.status(401).json({
        ok: false,
        msg: 'Usuario no autenticado',
      });
    }

    await actualizarSacramentoCompletoService({
      id_sacramento,
      data: req.body,
      usuario_id_usuario,
      transaction: t,
    });

    await t.commit();

    // =================================================================
    // ENLACE CON AWS OPENSEARCH - ACTUALIZACIÓN / EDICIÓN
    // =================================================================
    const { foja, numero, fecha_sacramento, tipo_sacramento_id_tipo, parroquiaId, relaciones } = req.body;

    // Parseamos relaciones en caso de que vengan serializadas como string
    const relacionesArray = typeof relaciones === 'string' ? JSON.parse(relaciones) : relaciones;

    const nombresInvolucrados = relacionesArray && Array.isArray(relacionesArray)
      ? relacionesArray.map(r => r.nombre_completo || r.nombre || '').join(' ')
      : '';

    const personasDB = await PersonaSacramento.findAll({
      where: { sacramento_id_sacramento: Number(id_sacramento) },
      include: [{ model: Persona, as: 'persona', attributes: ['carnet_identidad'] }]
    });
    const carnetsInvolucrados = personasDB
      .map(ps => (ps.persona?.carnet_identidad || '').trim().toLowerCase())
      .filter(Boolean);

    await indexarSacramento({
      id_sacramento:         Number(id_sacramento),
      foja,
      numero,
      fecha_sacramento,
      tipo_sacramento_id:    tipo_sacramento_id_tipo,
      parroquia_id:          parroquiaId,
      personas_involucradas: nombresInvolucrados.trim(),
      carnets_involucrados:  carnetsInvolucrados
    });
    // =================================================================

    return res.json({
      ok: true,
      msg: 'Sacramento actualizado correctamente',
      id_sacramento,
    });
  } catch (error) {
    await t.rollback();
    console.error('Error al actualizar sacramento completo:', error);
    return res.status(500).json({
      ok: false,
      msg: error.message || 'Error al actualizar el sacramento',
    });
  }
};



  module.exports = {
    getSacramentos,
    crearSacramento,
    getSacramento,
    actualizarSacramento,
    eliminarSacramento,
    getAllSacramentos,
    crearSacramentoCompleto,
    buscarSacramentosPorPersona,
    getSacramentoCompleto,
    actualizarSacramentoCompleto,
    buscarPersonasConTodosLosSacramentos
  };