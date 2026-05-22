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

    // ── Resolución de parroquia ──────────────────────────────────────────
    let parroquiaId = institucion_parroquia_id ? parseInt(institucion_parroquia_id) : null;
    let parroquiaNueva = false;

    if (datosDetectados.parroquia) {
      // El OCR extrajo un nombre → buscar o crear
      const [parroquia, creada] = await Parroquia.findOrCreate({
        where: { nombre: datosDetectados.parroquia },
        defaults: {
          nombre: datosDetectados.parroquia,
          direccion: 'Por completar',
          telefono: 'Por completar',
          email: `parroquia_${Date.now()}@pendiente.com` // único por el constraint
        }
      });

      parroquiaId = parroquia.id_parroquia;
      parroquiaNueva = creada;

      if (creada) {
        console.log(`Nueva parroquia registrada desde OCR: "${parroquia.nombre}" (id: ${parroquia.id_parroquia})`);
      }

    } else if (!parroquiaId) {
      // No hay parroquia en el OCR ni en el body → error
      fs.unlinkSync(req.file.path);
      return res.status(400).json({
        ok: false,
        msg: 'No se pudo detectar la parroquia en el documento y no se proporcionó institucion_parroquia_id'
      });
    }
    // ────────────────────────────────────────────────────────────────────

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
        nombre: datosDetectados.parroquia ?? null,
        nueva: parroquiaNueva  // el frontend puede avisar "parroquia creada, completar datos"
      }
    });

  } catch (error) {
    // Limpiar archivo aunque falle
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
      relaciones           
    } = req.body;

    const usuario_id = req.uid;

    // Buscar el histórico pendiente
    const historico = await SacramentoOcrHistorico.findOne({
      where: { id: historico_id, estado: 'pendiente' }
    });

    if (!historico) {
      return res.status(404).json({
        ok: false,
        msg: 'Histórico no encontrado o ya fue procesado'
      });
    }

    if (relaciones && Array.isArray(relaciones)) {
      const personaPrincipal = relaciones.find(r => r.rol_sacramento_id === 4); 
      if (personaPrincipal) {
        const persona_id = personaPrincipal.persona_id;

        // Confirmación requiere bautismo previo
        if (historico.tipo_sacramento_id === 2) {
          const tieneBautismo = await PersonaSacramento.findOne({
            include: [{
              model: Sacramento,
              as: 'sacramento',
              where: { tipo_sacramento_id_tipo: 1, activo: true }
            }],
            where: { persona_id_persona: persona_id }
          });

          if (!tieneBautismo) {
            await t.rollback();
            return res.status(400).json({
              ok: false,
              msg: 'La persona no tiene bautismo registrado, requerido para confirmación'
            });
          }
        }

        // Matrimonio requiere bautismo Y confirmación previos
        if (historico.tipo_sacramento_id === 3) {
        const tieneBautismo = await PersonaSacramento.findOne({
            include: [{
            model: Sacramento,
            as: 'sacramento',
            where: { tipo_sacramento_id_tipo: 1, activo: true }
            }],
            where: { persona_id_persona: persona_id }
        });

        if (!tieneBautismo) {
            await t.rollback();
            return res.status(400).json({
            ok: false,
            msg: 'La persona no tiene bautismo registrado, requerido para matrimonio'
            });
        }

        const tieneConfirmacion = await PersonaSacramento.findOne({
            include: [{
            model: Sacramento,
            as: 'sacramento',
            where: { tipo_sacramento_id_tipo: 2, activo: true } 
            }],
            where: { persona_id_persona: persona_id }
        });

        if (!tieneConfirmacion) {
            await t.rollback();
            return res.status(400).json({
            ok: false,
            msg: 'La persona no tiene confirmación registrada, requerida para matrimonio'
            });
        }
        }
      }
    }

    // Crear el sacramento real
    const nuevoSacramento = await Sacramento.create({
      fecha_sacramento,
      foja,
      numero,
      tipo_sacramento_id_tipo: historico.tipo_sacramento_id,
      institucion_parroquia_id_parroquia: historico.institucion_parroquia_id,
      usuario_id_usuario: usuario_id,
      activo: true,
      fecha_registro: new Date(),
      fecha_actualizacion: new Date()
    }, { transaction: t });

    if (relaciones && Array.isArray(relaciones)) {
      for (const rel of relaciones) {
        await PersonaSacramento.create({
          persona_id_persona: rel.persona_id,
          rol_sacramento_id_rol_sacra: rel.rol_sacramento_id,
          sacramento_id_sacramento: nuevoSacramento.id_sacramento
        }, { transaction: t });
      }
    }

    await historico.update({
      estado: 'confirmado',
      sacramento_id: nuevoSacramento.id_sacramento,
      fecha_actualizacion: new Date()
    }, { transaction: t });

    if (historico.tipo_sacramento_id === 3) {
        const datosMatrimonio = historico.datos_extraidos;

        await MatrimonioDetalle.create({
            sacramento_id_sacramento: nuevoSacramento.id_sacramento,
            reg_civil: datosMatrimonio.reg_civil ?? null,
            lugar_ceremonia: datosMatrimonio.lugar_ceremonia ?? null,
            numero_acta: datosMatrimonio.numero_acta ? parseInt(datosMatrimonio.numero_acta) : null
        }, { transaction: t });
    }

    await t.commit();
    return res.status(201).json({
      ok: true,
      msg: 'Sacramento confirmado y registrado correctamente',
      sacramento: nuevoSacramento,
      historico_id: historico.id
    });

  } catch (error) {
    await t.rollback();
    console.error('Error en confirmarOCR:', error);
    return res.status(500).json({
      ok: false,
      msg: 'Error al confirmar el sacramento',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
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

module.exports = {
  procesarOCR,
  confirmarOCR,
  getHistoricoOCR,
  rechazarOCR
};