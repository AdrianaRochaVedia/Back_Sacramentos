// controllers/personasacramentos.js
const { response } = require('express');
const PersonaSacramento = require('../models/PersonaSacramento');
const Persona = require('../models/Persona');
const Sacramento = require('../models/Sacramento');
const RolSacramento = require('../models/RolSacramento');

const getPersonaSacramentos = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const offset = (page - 1) * limit;
        
        const { count, rows } = await PersonaSacramento.findAndCountAll({
            offset,
            limit,
            include: [
                {
                    model: Persona,
                    as: 'persona',
                    attributes: ['id_persona', 'nombre', 'apellido_paterno', 'apellido_materno']
                },
                {
                    model: Sacramento,
                    as: 'sacramento',
                    attributes: ['id_sacramento', 'fecha_sacramento', 'numero', 'foja']
                },
                {
                    model: RolSacramento,
                    as: 'rolSacramento',
                    attributes: ['id_rol_sacra', 'nombre']
                }
            ]
        });

        res.json({
            ok: true,
            persona_sacramentos: rows,
            totalItems: count,
            totalPages: Math.ceil(count / limit),
            currentPage: page
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            ok: false,
            msg: 'Error al obtener las relaciones persona-sacramento'
        });
    }
};


const crearPersonaSacramento = async (req, res) => {
    const { persona_id_persona, rol_sacramento_id_rol_sacra, sacramento_id_sacramento } = req.body;

    try {
        // Verificar si ya existe la relación
        const existe = await PersonaSacramento.findOne({
            where: {
                persona_id_persona,
                rol_sacramento_id_rol_sacra,
                sacramento_id_sacramento
            }
        });

        if (existe) {
            return res.status(400).json({
                ok: false,
                msg: 'Esta relación persona-sacramento ya existe'
            });
        }

        const personaSacramento = await PersonaSacramento.create({
            persona_id_persona,
            rol_sacramento_id_rol_sacra,
            sacramento_id_sacramento
        });

        res.status(201).json({
            ok: true,
            personaSacramento
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({
            ok: false,
            msg: 'Hable con el administrador'
        });
    }
};


const getPersonasPorSacramento = async (req, res) => {
    const { sacramentoId } = req.params;

    try {
        const personaSacramentos = await PersonaSacramento.findAll({
            where: { sacramento_id_sacramento: sacramentoId },
            include: [
                {
                    model: Persona,
                    as: 'persona'
                },
                {
                    model: RolSacramento,
                    as: 'rolSacramento'
                }
            ]
        });

        res.json({
            ok: true,
            personaSacramentos
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            ok: false,
            msg: 'Error al obtener las personas del sacramento'
        });
    }
};

const getSacramentosPorPersona = async (req, res) => {
    const { personaId } = req.params;

    try {
        const personaSacramentos = await PersonaSacramento.findAll({
            where: { persona_id_persona: personaId },
            include: [
                {
                    model: Sacramento,
                    as: 'sacramento'
                },
                {
                    model: RolSacramento,
                    as: 'rolSacramento'
                }
            ]
        });

        res.json({
            ok: true,
            personaSacramentos
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            ok: false,
            msg: 'Error al obtener los sacramentos de la persona'
        });
    }
};


module.exports = {
    getPersonaSacramentos,
    crearPersonaSacramento,
    getPersonasPorSacramento,
    getSacramentosPorPersona,
};