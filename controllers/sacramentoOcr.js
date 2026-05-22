const fs = require('fs');
const { response } = require('express');
const { PutObjectCommand } = require('@aws-sdk/client-s3');
const { AnalyzeDocumentCommand } = require('@aws-sdk/client-textract');
const { s3, textract } = require('../config/aws');
const { parsearSegunTipo } = require('../helpers/ocrParser');
const SacramentoOcrHistorico = require('../models/SacramentoOCRHistorico');
const Sacramento = require('../models/Sacramento');
const PersonaSacramento = require('../models/PersonaSacramento');
const Persona = require('../models/Persona');
const TipoSacramento = require('../models/TipoSacramento');
const Parroquia = require('../models/Parroquia');
const MatrimonioDetalle = require('../models/MatrimonioDetalle');

// Funcion para subir imagen, hacer el OCR y guardar en histórico como 'pendiente'
const procesarOCR = async (req, res = response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ ok: false, msg: 'Debe subir una imagen' });
    }

    const { tipo_sacramento_id, institucion_parroquia_id } = req.body;
    const usuario_id = req.uid;

    if (!tipo_sacramento_id) {
      return res.status(400).json({
        ok: false,
        msg: 'Falta campo: tipo_sacramento_id'
      });
    }

    // Subir a S3
    const fileContent = fs.readFileSync(req.file.path);
    const key = `sacramentos/temp/${Date.now()}-${req.file.originalname}`;

    await s3.send(new PutObjectCommand({
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: key,
      Body: fileContent,
      ContentType: req.file.mimetype
    }));

    // OCR con Textract
    const textractResponse = await textract.send(new AnalyzeDocumentCommand({
      Document: {
        S3Object: { Bucket: process.env.AWS_BUCKET_NAME, Name: key }
      },
      FeatureTypes: ['FORMS', 'TABLES']
    }));

    const texto = textractResponse.Blocks
      .filter(b => b.BlockType === 'LINE')
      .map(b => b.Text)
      .join('\n');

    console.log('=== TEXTO EXTRAIDO ===');
    console.log(texto);
    console.log('=====================');

    const datosDetectados = parsearSegunTipo(texto, parseInt(tipo_sacramento_id));

    // Para parroquia
    let parroquiaId = institucion_parroquia_id ? parseInt(institucion_parroquia_id) : null;

    if (!parroquiaId && datosDetectados.parroquia) {

      if (req.body.crear_parroquia === 'true' && req.body.nombre_parroquia) {
        const nueva = await Parroquia.create({
          nombre: req.body.nombre_parroquia,
          direccion: 'Por completar',
          telefono: 'Por completar',
          email: `parroquia_${Date.now()}@pendiente.com`
        });
        parroquiaId = nueva.id_parroquia;

      } else {
        const historico = await SacramentoOcrHistorico.create({
          datos_extraidos: datosDetectados,
          s3_key: key,
          estado: 'esperando_parroquia',
          usuario_id,
          institucion_parroquia_id: null,
          tipo_sacramento_id: parseInt(tipo_sacramento_id),
          fecha_registro: new Date(),
          fecha_actualizacion: new Date()
        });

        fs.unlinkSync(req.file.path);
        return res.status(200).json({
          ok: false,
          requiere_confirmacion_parroquia: true,
          msg: 'No se pudo identificar la parroquia con certeza. Por favor selecciona o confirma.',
          historico_id: historico.id,
          parroquia_detectada: datosDetectados.parroquia,
          datos_ocr: datosDetectados,
          tipo_sacramento_id: parseInt(tipo_sacramento_id)
        });
      }
    }

    if (!parroquiaId) {
    const historico = await SacramentoOcrHistorico.create({
        datos_extraidos: datosDetectados,
        s3_key: key,
        estado: 'esperando_parroquia',
        usuario_id,
        institucion_parroquia_id: null,
        tipo_sacramento_id: parseInt(tipo_sacramento_id),
        fecha_registro: new Date(),
        fecha_actualizacion: new Date()
    });

    fs.unlinkSync(req.file.path);

    return res.status(200).json({
        ok: false,
        requiere_confirmacion_parroquia: true,
        msg: 'No se pudo identificar la parroquia con certeza. Por favor selecciona o confirma.',
        historico_id: historico.id,
        parroquia_detectada: datosDetectados.parroquia || null,
        datos_ocr: datosDetectados,
        tipo_sacramento_id: parseInt(tipo_sacramento_id)
    });
    }

    // Guardar en histórico
    const historico = await SacramentoOcrHistorico.create({
      datos_extraidos: datosDetectados,
      s3_key: key,
      estado: 'pendiente',
      usuario_id,
      institucion_parroquia_id: parroquiaId,
      tipo_sacramento_id: parseInt(tipo_sacramento_id),
      fecha_registro: new Date(),
      fecha_actualizacion: new Date()
    });

    fs.unlinkSync(req.file.path);

    return res.json({
      ok: true,
      msg: 'OCR procesado correctamente',
      historico_id: historico.id,
      datosDetectados,
      s3_key: key,
      parroquia: {
        id: parroquiaId,
        nombre: req.body.nombre_parroquia ?? datosDetectados.parroquia ?? null
      }
    });

  } catch (error) {
    if (req.file?.path) {
      try { fs.unlinkSync(req.file.path); } catch (_) {}
    }
    console.error('Error en procesarOCR:', error);
    return res.status(500).json({
      ok: false,
      msg: 'Error al procesar OCR',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Funcion para validar reglas de negocio y crea el sacramento real desde el histórico
const confirmarOCR = async (req, res = response) => {

  const t = await Sacramento.sequelize.transaction();

  try {

    const {
      historico_id,
      fecha_sacramento,
      foja,
      numero,
      relaciones,
      nueva_persona
    } = req.body;

    const usuario_id = req.uid;

    console.log("BODY:", req.body);

    const historico = await SacramentoOcrHistorico.findOne({
      where: {
        id: historico_id,
        estado: 'pendiente'
      }
    });

    console.log("HISTORICO:", historico?.toJSON());

    if (!historico) {
      return res.status(404).json({
        ok: false,
        msg: 'Histórico no encontrado o ya fue procesado'
      });
    }

    let personaPrincipalId = null;
    let personaCreada = false;

    // =========================================
    // BAUTISMO
    // =========================================

    if (
      historico.tipo_sacramento_id === 1 ||
      historico.tipo_sacramento_id_tipo === 1
    ) {

      console.log("ENTRANDO A BAUTISMO");
      console.log("NUEVA PERSONA:", nueva_persona);

      const relPrincipal = relaciones?.find(
        r => r.rol_sacramento_id === 4
      );

      // =====================================
      // PERSONA EXISTENTE
      // =====================================

      if (relPrincipal?.persona_id) {

        const existe = await Persona.findByPk(
          relPrincipal.persona_id
        );

        if (!existe) {

          await t.rollback();

          return res.status(404).json({
            ok: false,
            msg: `No se encontró la persona con id ${relPrincipal.persona_id}`
          });
        }

        personaPrincipalId = relPrincipal.persona_id;
      }

      // =====================================
      // NUEVA PERSONA OCR
      // =====================================

      else if (nueva_persona) {

        // ================================
        // PROCESAR NOMBRE COMPLETO
        // ================================

        const nombreCompleto =
          nueva_persona.nombre_completo ||
          nueva_persona.nombre ||
          '';

        const partes =
          nombreCompleto
            .trim()
            .split(/\s+/);

        let nombre = '';
        let apellido_paterno = '';
        let apellido_materno = '';

        if (partes.length >= 3) {

          apellido_materno =
            partes.pop();

          apellido_paterno =
            partes.pop();

          nombre =
            partes.join(' ');

        } else {

          nombre =
            nombreCompleto;

          apellido_paterno =
            'PENDIENTE';

          apellido_materno =
            'PENDIENTE';
        }

        // ================================
        // CI TEMPORAL ÚNICO
        // ================================

        const ciTemporal =
          `OCR-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

        // ================================
        // BUSCAR SI YA EXISTE
        // ================================

        const wherePersona = {
          nombre,
          apellido_paterno,
          apellido_materno
        };

        console.log("WHERE PERSONA:", wherePersona);

        const personaExistente =
          await Persona.findOne({
            where: wherePersona
          });

        console.log(
          "PERSONA EXISTENTE:",
          personaExistente
        );

        // ================================
        // YA EXISTE
        // ================================

        if (personaExistente) {

          personaPrincipalId =
            personaExistente.id_persona;

          personaCreada = false;
        }

        // ================================
        // CREAR NUEVA
        // ================================

        else {

          const creada =
            await Persona.create({

              nombre,

              apellido_paterno,

              apellido_materno,

              carnet_identidad:
                nueva_persona.carnet_identidad ||
                ciTemporal,

              fecha_nacimiento:
                nueva_persona.fecha_nacimiento ||
                '1900-01-01',

              lugar_nacimiento:
                nueva_persona.lugar_nacimiento ||
                'PENDIENTE',

              nombre_padre:
                nueva_persona.nombre_padre ||
                'PENDIENTE',

              nombre_madre:
                nueva_persona.nombre_madre ||
                'PENDIENTE',

              activo: true,

              estado:
                'pendiente_actualizacion'

            }, {
              transaction: t
            });

          console.log(
            "PERSONA CREADA:",
            creada
          );

          personaPrincipalId =
            creada.id_persona;

          personaCreada = true;
        }

      }

      // =====================================
      // ERROR
      // =====================================

      else {

        await t.rollback();

        return res.status(400).json({
          ok: false,
          msg: 'Debe enviar persona_id o nueva_persona'
        });
      }

    }

    // =========================================
    // OTROS SACRAMENTOS
    // =========================================

    else {

      console.log("NO ES BAUTISMO");

      const relPrincipal = relaciones?.find(
        r => r.rol_sacramento_id === 4
      );

      if (!relPrincipal?.persona_id) {

        await t.rollback();

        return res.status(400).json({
          ok: false,
          msg: 'La persona debe estar registrada previamente'
        });
      }

      const existe = await Persona.findByPk(
        relPrincipal.persona_id
      );

      if (!existe) {

        await t.rollback();

        return res.status(404).json({
          ok: false,
          msg: `No se encontró la persona`
        });
      }

      personaPrincipalId =
        relPrincipal.persona_id;
    }

    // =========================================
    // CREAR SACRAMENTO
    // =========================================

    const nuevoSacramento =
      await Sacramento.create({

        fecha_sacramento,
        foja,
        numero,

        tipo_sacramento_id_tipo:
          historico.tipo_sacramento_id ||
          historico.tipo_sacramento_id_tipo,

        institucion_parroquia_id_parroquia:
          historico.institucion_parroquia_id,

        usuario_id_usuario:
          usuario_id,

        activo: true,

        fecha_registro: new Date(),

        fecha_actualizacion: new Date()

      }, {
        transaction: t
      });

    // =========================================
    // RELACION PERSONA SACRAMENTO
    // =========================================

    await PersonaSacramento.create({

      persona_id_persona:
        personaPrincipalId,

      rol_sacramento_id_rol_sacra: 4,

      sacramento_id_sacramento:
        nuevoSacramento.id_sacramento

    }, {
      transaction: t
    });

    // =========================================
    // OTRAS RELACIONES
    // =========================================

    if (relaciones && Array.isArray(relaciones)) {

      for (const rel of relaciones.filter(
        r => r.rol_sacramento_id !== 4
      )) {

        await PersonaSacramento.create({

          persona_id_persona:
            rel.persona_id,

          rol_sacramento_id_rol_sacra:
            rel.rol_sacramento_id,

          sacramento_id_sacramento:
            nuevoSacramento.id_sacramento

        }, {
          transaction: t
        });
      }
    }

    // =========================================
    // ACTUALIZAR HISTORICO
    // =========================================

    await historico.update({

      estado: 'confirmado',

      sacramento_id:
        nuevoSacramento.id_sacramento,

      fecha_actualizacion:
        new Date()

    }, {
      transaction: t
    });

    await t.commit();

    return res.status(201).json({

      ok: true,

      msg:
        'Sacramento confirmado correctamente',

      sacramento:
        nuevoSacramento,

      persona_id:
        personaPrincipalId,

      persona_creada:
        personaCreada

    });

  } catch (error) {

    await t.rollback();

    console.error(
      'Error en confirmarOCR:',
      error
    );

    return res.status(500).json({

      ok: false,

      msg:
        'Error al confirmar el sacramento',

      error:
        process.env.NODE_ENV === 'development'
          ? error.message
          : undefined
    });
  }
};
// funcion para listar el histórico de si ya fue registrado
const getHistoricoOCR = async (req, res = response) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const { tipo_sacramento_id, estado, institucion_parroquia_id } = req.query;
    const where = {};
    if (tipo_sacramento_id) where.tipo_sacramento_id = parseInt(tipo_sacramento_id);
    if (estado) where.estado = estado;
    if (institucion_parroquia_id) where.institucion_parroquia_id = parseInt(institucion_parroquia_id);

    const { count, rows } = await SacramentoOcrHistorico.findAndCountAll({
      where,
      include: [
        {
          model: TipoSacramento,
          as: 'tipoSacramento',
          attributes: ['id_tipo', 'nombre']
        },
        {
          model: Parroquia,
          as: 'parroquia',
          attributes: ['id_parroquia', 'nombre']
        }
      ],
      order: [['fecha_registro', 'DESC']],
      limit,
      offset
    });

    return res.json({
      ok: true,
      historico: rows.map(h => ({
        ...h.get({ plain: true }),
        registrado: h.sacramento_id !== null   
      })),
      totalItems: count,
      totalPages: Math.ceil(count / limit),
      currentPage: page
    });

  } catch (error) {
    console.error('Error en getHistoricoOCR:', error);
    return res.status(500).json({
      ok: false,
      msg: 'Error al obtener histórico OCR',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Funcion para marcar un histórico como rechazado
const rechazarOCR = async (req, res = response) => {
  try {
    const { id } = req.params;
    const historico = await SacramentoOcrHistorico.findOne({
      where: { id, estado: 'pendiente' }
    });

    if (!historico) {
      return res.status(404).json({
        ok: false,
        msg: 'Histórico no encontrado o ya fue procesado'
      });
    }

    await historico.update({
      estado: 'rechazado',
      fecha_actualizacion: new Date()
    });

    return res.json({
      ok: true,
      msg: 'Registro OCR rechazado correctamente'
    });

  } catch (error) {
    console.error('Error en rechazarOCR:', error);
    return res.status(500).json({
      ok: false,
      msg: 'Error al rechazar el registro OCR',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

//Para confirmar parroquia
const confirmarParroquiaOCR = async (req, res = response) => {
  try {
    const { id } = req.params;
    const { institucion_parroquia_id } = req.body;

    if (!institucion_parroquia_id) {
      return res.status(400).json({ ok: false, msg: 'Falta institucion_parroquia_id' });
    }

    const historico = await SacramentoOcrHistorico.findOne({
      where: { id, estado: 'esperando_parroquia' }
    });

    if (!historico) {
      return res.status(404).json({ ok: false, msg: 'Histórico no encontrado o ya fue procesado' });
    }

    await historico.update({
      institucion_parroquia_id: parseInt(institucion_parroquia_id),
      estado: 'pendiente',
      fecha_actualizacion: new Date()
    });

    return res.json({
      ok: true,
      msg: 'Parroquia confirmada correctamente',
      historico_id: historico.id
    });

  } catch (error) {
    console.error('Error en confirmarParroquiaOCR:', error);
    return res.status(500).json({ ok: false, msg: 'Error al confirmar parroquia' });
  }
};

const crearYConfirmarParroquiaOCR = async (req, res = response) => {
  try {
    const { id } = req.params;
    const {
      nombre_parroquia,
      direccion = 'Por completar',
      telefono = 'Por completar',
      email
    } = req.body;

    // Buscar el histórico en estado esperando_parroquia
    const historico = await SacramentoOcrHistorico.findOne({
      where: { id, estado: 'esperando_parroquia' }
    });

    if (!historico) {
      return res.status(404).json({
        ok: false,
        msg: 'Histórico no encontrado o ya fue procesado'
      });
    }

    // Crear la parroquia nueva
    const nuevaParroquia = await Parroquia.create({
      nombre: nombre_parroquia,
      direccion,
      telefono,
      email: email ?? `parroquia_${Date.now()}@pendiente.com`
    });

    // Actualizar el histórico a 'pendiente' con la nueva parroquia
    await historico.update({
      institucion_parroquia_id: nuevaParroquia.id_parroquia,
      estado: 'pendiente',
      fecha_actualizacion: new Date()
    });

    return res.json({
      ok: true,
      msg: 'Parroquia creada y asignada correctamente',
      historico_id: historico.id,
      parroquia: {
        id: nuevaParroquia.id_parroquia,
        nombre: nuevaParroquia.nombre
      }
    });

  } catch (error) {
    console.error('Error en crearYConfirmarParroquiaOCR:', error);
    return res.status(500).json({
      ok: false,
      msg: 'Error al crear la parroquia',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

module.exports = {
  procesarOCR,
  confirmarOCR,
  getHistoricoOCR,
  rechazarOCR,
  confirmarParroquiaOCR,
  crearYConfirmarParroquiaOCR
};