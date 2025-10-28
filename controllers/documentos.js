const { response } = require('express');
const { Op, literal, fn, col } = require('sequelize');
const Documento = require('../models/Sacramento');
const VersionDocumento = require('../models/VersionDocumento');
const { validarCampos } = require('../middlewares/validar-campos');


// Función para procesar y generar búsquedas de texto completo
const procesarTextoBusqueda = (texto) => {
  return texto.trim().split(/\s+/).filter(p => p.length > 2);
};

// Obtener todos los documentos activos
const getDocumentos = async (req, res = response) => {
    try {
        const page = parseInt(req.query.page) || 1;         
        const limit = parseInt(req.query.limit) || 10;      
        const offset = (page - 1) * limit;                 

        const { count, rows: documentos } = await Documento.findAndCountAll({
            where: { isDeleted: false },
            include: [{ model: require('../models/Usuario'), attributes: ['id_usuario'] }],
            limit,
            offset,
            order: [['id_documento', 'DESC']]
        });

        res.json({
            ok: true,
            total: count,
            page,
            totalPages: Math.ceil(count / limit),
            documentos
        });
    } catch (error) {
        console.error('Error al obtener documentos:', error);
        res.status(500).json({
            ok: false,
            msg: 'Error al obtener los documentos'
        });
    }
};


// Obtener un documento por ID
const getDocumento = async (req, res = response) => {
    const { id } = req.params;
    try {
        const documento = await Documento.findOne({
            where: { id_documento: id, isDeleted: false },
            include: [{ model: require('../models/Usuario'), attributes: ['id_usuario'] }]
        });

        if (!documento) {
            return res.status(404).json({
                ok: false,
                msg: 'Documento no encontrado'
            });
        }

        // Incrementar vistas
        await documento.increment('vistas');

        res.json({
            ok: true,
            documento
        });
    } catch (error) {
        console.error('Error al obtener documento:', error);
        res.status(500).json({
            ok: false,
            msg: 'Error al obtener el documento'
        });
    }
};

// Crear un nuevo documento
const crearDocumento = async (req, res = response) => {
    const { nombre, tipo, fuente_origen, descripcion, importancia, anio_publicacion, enlace,concepto_basico, aplicacion, cpe, jerarquia } = req.body;

    try {
        const usuarioId = req.uid; // Obtenido del JWT

        // Verificar usuario
        const Usuario = require('../models/Usuario');
        const usuario = await Usuario.findByPk(usuarioId);
        if (!usuario) {
            return res.status(400).json({
                ok: false,
                msg: 'Usuario no encontrado'
            });
        }

        let fechaNormalizada = null;
        if (anio_publicacion) {
            const date = new Date(anio_publicacion);
            if (isNaN(date.getTime())) {
                return res.status(400).json({
                    ok: false,
                    msg: 'Fecha de publicación inválida'
                });
            }
            // Forzar a UTC
            fechaNormalizada = new Date(Date.UTC(
                date.getFullYear(),
                date.getMonth(),
                date.getDate()
            ));
        }

        // Crear documento
        const documento = await Documento.create({
            nombre,
            tipo,
            fuente_origen,
            descripcion,
            importancia,
            anio_publicacion: fechaNormalizada,
            enlace,
            concepto_basico,
            USUARIO_id_usuario: usuarioId,
            aplicacion,
            cpe,
            jerarquia,
            isDeleted: false,
            vistas: 0,
        });

        // Formateado
        const documentoFormateado = {
            ...documento.toJSON(),
            anio_publicacion: documento.anio_publicacion
                ? documento.anio_publicacion.toISOString()
                : null
        };

        res.status(201).json({
            ok: true,
            documento: documentoFormateado
        });
    } catch (error) {
        console.error('Error al crear documento:', error);
        res.status(500).json({
            ok: false,
            msg: 'Error al crear el documento'
        });
    }
};

// Actualizar un documento
const actualizarDocumento = async (req, res = response) => {
    const { id } = req.params;
    const { nombre, tipo, fuente_origen, descripcion, importancia, anio_publicacion, enlace, 
            concepto_basico, aplicacion, cpe, jerarquia } = req.body;

    try {
        const documento = await Documento.findOne({
            where: { id_documento: id, isDeleted: false }
        });

        if (!documento) {
            return res.status(404).json({
                ok: false,
                msg: 'Documento no encontrado'
            });
        }
        if (documento.USUARIO_id_usuario !== req.uid) {
            return res.status(403).json({
                ok: false,
                msg: 'No tiene permisos para modificar este documento'
            });
        }

        // Guardar versión anterior
        const previousVersionCount = await VersionDocumento.count({
            where: { DOCUMENTO_id_documento: id }
        });

        await VersionDocumento.create({
            nombre: documento.nombre,
            tipo: documento.tipo,
            fuente_origen: documento.fuente_origen,
            descripcion: documento.descripcion,
            importancia: documento.importancia,
            anio_publicacion: documento.anio_publicacion,
            enlace: documento.enlace,
            concepto_basico: documento.concepto_basico,
            aplicacion: documento.aplicacion,
            cpe: documento.cpe,
            jerarquia: documento.jerarquia,
            isVersion: true,
            vistas: documento.vistas,
            DOCUMENTO_id_documento: id,
            USUARIO_id_usuario: req.uid,
            fecha_version: new Date(),
            numero_version: previousVersionCount + 1,
            palabras_clave_procesadas: documento.palabras_clave_procesadas
        });

        // Normalizar anio_publicacion
        let fechaNormalizada = null;
        if (anio_publicacion) {
            const date = new Date(anio_publicacion);
            if (isNaN(date.getTime())) {
                return res.status(400).json({
                    ok: false,
                    msg: 'Fecha de publicación inválida'
                });
            }
            fechaNormalizada = new Date(Date.UTC(
                date.getFullYear(),
                date.getMonth(),
                date.getDate()
            ));
        }

        // Actualizar campos
        await documento.update({
            nombre,
            tipo,
            fuente_origen,
            descripcion,
            importancia,
            anio_publicacion: fechaNormalizada,
            enlace,
            concepto_basico,
            aplicacion,
            cpe,
            jerarquia
        });

        const documentoFormateado = {
            ...documento.toJSON(),
            anio_publicacion: documento.anio_publicacion
                ? documento.anio_publicacion.toISOString().split('T')[0]
                : null
        };

        res.json({
            ok: true,
            documento: documentoFormateado
        });
    } catch (error) {
        console.error('Error al actualizar documento:', error);
        res.status(500).json({
            ok: false,
            msg: 'Error al actualizar el documento'
        });
    }
};

// Eliminado lógico de un documento
const eliminarDocumento = async (req, res = response) => {
    const { id } = req.params;

    try {
        const documento = await Documento.findOne({
            where: { id_documento: id, isDeleted: false }
        });

        if (!documento) {
            return res.status(404).json({
                ok: false,
                msg: 'Documento no encontrado'
            });
        }

        if (documento.USUARIO_id_usuario !== req.uid) {
            return res.status(403).json({
                ok: false,
                msg: 'No tiene permisos para eliminar este documento'
            });
        }
        
        await documento.update({ isDeleted: true });

        res.json({
            ok: true,
            msg: 'Documento eliminado correctamente'
        });
    } catch (error) {
        console.error('Error al eliminar documento:', error);
        res.status(500).json({
            ok: false,
            msg: 'Error al eliminar el documento'
        });
    }
};

// Búsqueda de documentos por nombre
const buscarPorNombre = async (req, res = response) => {
    try {
        const { nombre } = req.query;
        
        if (!nombre) {
            return res.status(400).json({
                ok: false,
                msg: 'El parámetro nombre es requerido'
            });
        }

        const documentos = await Documento.findAll({
            where: {
                nombre: {
                    [Op.like]: `%${nombre}%`
                },
                isDeleted: false
            },
            include: [{ model: require('../models/Usuario'), attributes: ['id_usuario'] }]
        });

        return res.json({
            ok: true,
            documentos
        });
    } catch (error) {
        console.error('Error al buscar documentos por nombre:', error);
        return res.status(500).json({
            ok: false,
            msg: 'Error en la búsqueda de documentos por nombre'
        });
    }
};

//Busqueda de documentos por palabras clave
const buscarPorPalabrasClave = async (req, res = response) => {
    try {
        const { palabras_clave } = req.query;
        
        if (!palabras_clave) {
            return res.status(400).json({
                ok: false,
                msg: 'El parámetro palabras_clave es requerido'
            });
        }

        const palabras = procesarTextoBusqueda(palabras_clave);
        
        if (palabras.length === 0) {
            return res.json({
                ok: true,
                documentos: []
            });
        }

        // busqueda de palabras clave en varios campos
        const conditions = palabras.map(palabra => ({
            [Op.or]: [
                { palabras_clave_procesadas: { [Op.like]: `%${palabra}%` } },
                { descripcion: { [Op.like]: `%${palabra}%` } },
                { concepto_basico: { [Op.like]: `%${palabra}%` } }
            ]
        }));

        const documentos = await Documento.findAll({
            where: {
                [Op.and]: [
                    { isDeleted: false },
                    { [Op.or]: conditions }
                ]
            },
            include: [{ model: require('../models/Usuario'), attributes: ['id_usuario'] }]
        });

        // para incrementar las vistas de los documentos
        for (const doc of documentos) {
            await doc.increment('vistas');
        }

        return res.json({
            ok: true,
            documentos
        });
    } catch (error) {
        console.error('Error al buscar documentos por palabras clave:', error);
        return res.status(500).json({
            ok: false,
            msg: 'Error en la búsqueda de documentos por palabras clave'
        });
    }
};

// Bsqueda de documentos por tipo de documento
const buscarPorTipo = async (req, res = response) => {
    try {
        const { tipo } = req.query;
        
        if (!tipo) {
            return res.status(400).json({
                ok: false,
                msg: 'El parámetro tipo es requerido'
            });
        }

        const documentos = await Documento.findAll({
            where: {
                tipo: {
                    [Op.like]: `%${tipo}%`
                },
                isDeleted: false
            },
            include: [{ model: require('../models/Usuario'), attributes: ['id_usuario'] }]
        });

        return res.json({
            ok: true,
            documentos
        });
    } catch (error) {
        console.error('Error al buscar documentos por tipo:', error);
        return res.status(500).json({
            ok: false,
            msg: 'Error en la búsqueda de documentos por tipo'
        });
    }
};

// Busqueda de documentos por año de vigencia
const buscarPorAnio = async (req, res = response) => {
    try {
        const { anio } = req.query;
        
        if (!anio) {
            return res.status(400).json({
                ok: false,
                msg: 'El parámetro anio es requerido'
            });
        }

        const documentos = await Documento.findAll({
            where: {
                [Op.and]: [
                    literal(`YEAR(anio_publicacion) = ${anio}`),
                    { isDeleted: false }
                ]
            },
            include: [{ model: require('../models/Usuario'), attributes: ['id_usuario'] }]
        });

        return res.json({
            ok: true,
            documentos
        });
    } catch (error) {
        console.error('Error al buscar documentos por año:', error);
        return res.status(500).json({
            ok: false,
            msg: 'Error en la búsqueda de documentos por año'
        });
    }
};

//Busqueda de documentos por fuente origen
const buscarPorFuente = async (req, res = response) => {
    try {
        const { fuente } = req.query;
        
        if (!fuente) {
            return res.status(400).json({
                ok: false,
                msg: 'El parámetro fuente es requerido'
            });
        }

        const documentos = await Documento.findAll({
            where: {
                fuente_origen: {
                    [Op.like]: `%${fuente}%`
                },
                isDeleted: false
            },
            include: [{ model: require('../models/Usuario'), attributes: ['id_usuario'] }]
        });

        return res.json({
            ok: true,
            documentos
        });
    } catch (error) {
        console.error('Error al buscar documentos por fuente:', error);
        return res.status(500).json({
            ok: false,
            msg: 'Error en la búsqueda de documentos por fuente'
        });
    }
};

//Filtro inteligente
const filtradoInteligente = async (req, res = response) => {
    try {
        // Obtenemos documentos más vistos (que indican palabras más buscadas)
        const documentosMasVistos = await Documento.findAll({
            where: {
                isDeleted: false,
                vistas: {
                    [Op.gt]: 0 
                }
            },
            order: [['vistas', 'DESC']],
            limit: 10
        });
        
        // extraer palabras clave de los documentos
        let palabrasComunes = new Set();
        documentosMasVistos.forEach(doc => {
            if (doc.palabras_clave_procesadas) {
                doc.palabras_clave_procesadas.split(',').forEach(palabra => {
                    if (palabra.trim().length > 3) { // ignoramos palabras muy cortas
                        palabrasComunes.add(palabra.trim().toLowerCase());
                    }
                });
            }
            
            if (doc.descripcion) {
                const palabrasDesc = doc.descripcion
                    .split(/\s+/)
                    .filter(p => p.length > 4) // palabras más largas suelen ser más significativas
                    .map(p => p.toLowerCase().replace(/[^\w\sáéíóúüñ]/g, ''));
                    
                palabrasDesc.forEach(p => palabrasComunes.add(p));
            }
        });
        
        const palabrasRelevantes = Array.from(palabrasComunes).slice(0, 20);
        
        if (palabrasRelevantes.length === 0) {
            return res.json({
                ok: true,
                documentos: [],
                palabrasRelevantes: []
            });
        }
        
        const conditions = palabrasRelevantes.map(palabra => ({
            [Op.or]: [
                { palabras_clave_procesadas: { [Op.like]: `%${palabra}%` } },
                { descripcion: { [Op.like]: `%${palabra}%` } },
                { concepto_basico: { [Op.like]: `%${palabra}%` } }
            ]
        }));

        const documentos = await Documento.findAll({
            where: {
                [Op.and]: [
                    { isDeleted: false },
                    { [Op.or]: conditions }
                ]
            },
            include: [{ model: require('../models/Usuario'), attributes: ['id_usuario'] }],
            limit: 20
        });

        return res.json({
            ok: true,
            documentos,
            palabrasRelevantes
        });
    } catch (error) {
        console.error('Error en el filtrado inteligente:', error);
        return res.status(500).json({
            ok: false,
            msg: 'Error en el filtrado inteligente de documentos'
        });
    }
};

module.exports = {
    getDocumentos,
    getDocumento,
    crearDocumento,
    actualizarDocumento,
    eliminarDocumento,
    buscarPorNombre,
    buscarPorPalabrasClave,
    buscarPorTipo,
    buscarPorAnio,
    buscarPorFuente,
    filtradoInteligente
};