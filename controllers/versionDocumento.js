const { response } = require('express');
const VersionDocumento = require('../models/VersionDocumento');
const Documento = require('../models/Documento');

// Obtener todas las versiones de un documento
const getVersionesDocumento = async (req, res = response) => {
    const { id } = req.params;

    try {
        const versiones = await VersionDocumento.findAll({
            where: { DOCUMENTO_id_documento: id },
            include: [
                { model: Documento, attributes: ['id_documento'] }
            ],
            order: [['numero_version', 'DESC']]
        });

        res.json({
            ok: true,
            versiones
        });
    } catch (error) {
        console.error('Error al obtener versiones:', error);
        res.status(500).json({
            ok: false,
            msg: 'Error al obtener las versiones'
        });
    }
};

// Obtener una versión específica
const getVersionDocumento = async (req, res = response) => {
    const { id, versionId } = req.params;

    try {
        const version = await VersionDocumento.findOne({
            where: { 
                id_version: versionId, 
                DOCUMENTO_id_documento: id 
            },
            include: [
                { model: Documento, attributes: ['id_documento'] }
            ]
        });

        if (!version) {
            return res.status(404).json({
                ok: false,
                msg: 'Versión no encontrada'
            });
        }

        res.json({
            ok: true,
            version
        });
    } catch (error) {
        console.error('Error al obtener versión:', error);
        res.status(500).json({
            ok: false,
            msg: 'Error al obtener la versión'
        });
    }
};

// Restaurar una versión específica
const restaurarVersion = async (req, res = response) => {
    const { id, versionId } = req.params;

    try {
        const version = await VersionDocumento.findOne({
            where: { 
                id_version: versionId, 
                DOCUMENTO_id_documento: id 
            }
        });

        if (!version) {
            return res.status(404).json({
                ok: false,
                msg: 'Versión no encontrada'
            });
        }

        const documento = await Documento.findOne({
            where: { 
                id_documento: id, 
                isDeleted: false 
            }
        });

        if (!documento) {
            return res.status(404).json({
                ok: false,
                msg: 'Documento no encontrado'
            });
        }

        // Actualizar documento con los datos de la versión
        await documento.update({
            nombre: version.nombre,
            tipo: version.tipo,
            fuente_origen: version.fuente_origen,
            descripcion: version.descripcion,
            importancia: version.importancia,
            anio_publicacion: version.anio_publicacion,
            enlace: version.enlace,
            concepto_basico: version.concepto_basico,
            aplicacion: version.aplicacion,
            cpe: version.cpe,
            jerarquia: version.jerarquia,
        });

        // Guardar nueva versión con el estado anterior
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
            fecha_version: new Date(),
            numero_version: previousVersionCount + 1,
        });

        res.json({
            ok: true,
            documento
        });
    } catch (error) {
        console.error('Error al restaurar versión:', error);
        res.status(500).json({
            ok: false,
            msg: 'Error al restaurar la versión.'
        });
    }
};

module.exports = {
    getVersionesDocumento,
    getVersionDocumento,
    restaurarVersion
};
