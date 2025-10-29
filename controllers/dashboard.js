const { Op, Sequelize } = require('sequelize');
const { sequelize } = require('../database/config');

const Sacramento = require('../models/Sacramento');
const Persona = require('../models/Persona');
const Parroquia = require('../models/Parroquia');
const TipoSacramento = require('../models/TipoSacramento');
const PersonaSacramento = require('../models/PersonaSacramento');
const RolSacramento = require('../models/RolSacramento');


const getDashboardStats = async (req, res) => {
  try {
    const { fechaInicio, fechaFin, sacramentos } = req.query;

    // Filtros de fecha
    const whereSacramento = {};
    if (fechaInicio || fechaFin) {
      whereSacramento.fecha_sacramento = {};
      if (fechaInicio) whereSacramento.fecha_sacramento[Op.gte] = fechaInicio;
      if (fechaFin) whereSacramento.fecha_sacramento[Op.lte] = fechaFin;
    }

    // Filtro por tipo de sacramento (por nombre)
    let tipoSacramentoIds = [];
    if (sacramentos && sacramentos.length > 0) {
      const tipos = await TipoSacramento.findAll({
        where: { nombre: { [Op.in]: sacramentos } },
        attributes: ['id_tipo']
      });
      tipoSacramentoIds = tipos.map(t => t.id_tipo);
      if (tipoSacramentoIds.length > 0) {
        whereSacramento.tipo_sacramento_id_tipo = { [Op.in]: tipoSacramentoIds };
      } else {
        return res.json({ kpis: {}, timeline: [], combinaciones: [] });
      }
    }

    // 1. KPIs
    const [totalPersonas, totalSacramentos, totalParroquias] = await Promise.all([
      Persona.count({ where: { activo: true } }),
      Sacramento.count({ where: whereSacramento }),
      Parroquia.count()
    ]);

    // 2. Timeline: sacramentos por año y tipo
    const timelineRaw = await Sacramento.findAll({
      attributes: [
        [sequelize.fn('EXTRACT', sequelize.literal("YEAR FROM fecha_sacramento")), 'year'],
        'tipoSacramento.nombre',
        [sequelize.fn('COUNT', sequelize.col('id_sacramento')), 'count']
      ],
      include: [{
        model: TipoSacramento,
        as: 'tipoSacramento',
        attributes: [],
        where: tipoSacramentoIds.length > 0 ? { id_tipo: { [Op.in]: tipoSacramentoIds } } : {}
      }],
      where: whereSacramento,
      group: ['year', 'tipoSacramento.nombre'],
      order: [[sequelize.fn('EXTRACT', sequelize.literal("YEAR FROM fecha_sacramento")), 'ASC']],
      raw: true
    });

    // Mapear a formato del frontend
    const years = [...new Set(timelineRaw.map(t => t.year))].sort();
    const tiposMap = {
      'Bautizo': 'bautismo',
      'Primera comunion Actualizado': 'comunion',
      'Confirmación': 'confirmacion',
      'Boda': 'matrimonio'
    };

    const timeline = years.map(year => {
      const entry = { periodo: year.toString() };
      Object.keys(tiposMap).forEach(nombre => {
        const key = tiposMap[nombre];
        const found = timelineRaw.find(t => t.year == year && t['tipoSacramento.nombre'] === nombre);
        entry[key] = found ? parseInt(found.count) : 0;
      });
      return entry;
    });

    // 3. Combinaciones de sacramentos por persona
    // Obtenemos todas las relaciones persona-sacramento con sus tipos
    const personaSacramentosData = await PersonaSacramento.findAll({
      attributes: ['persona_id_persona'],
      include: [
        {
          model: Sacramento,
          as: 'sacramento',
          attributes: ['tipo_sacramento_id_tipo'],
          where: whereSacramento,
          include: [{
            model: TipoSacramento,
            as: 'tipoSacramento',
            attributes: ['nombre'],
            where: tipoSacramentoIds.length > 0 ? { id_tipo: { [Op.in]: tipoSacramentoIds } } : {}
          }]
        }
      ],
      raw: true
    });

    // Agrupar por persona y obtener tipos únicos de sacramento
    const personaSacramentosMap = {};
    personaSacramentosData.forEach(row => {
      const personaId = row.persona_id_persona;
      const tipoNombre = row['sacramento.tipoSacramento.nombre'];
      
      if (!personaSacramentosMap[personaId]) {
        personaSacramentosMap[personaId] = new Set();
      }
      personaSacramentosMap[personaId].add(tipoNombre);
    });

    // Normalizar nombres de sacramentos
    const normalizar = (str) => str?.trim().toLowerCase();
    const sacramentoSet = (tipos) => {
      const set = new Set();
      
      tipos.forEach(tipo => {
        const norm = normalizar(tipo);
        if (norm.includes('bautiz')) set.add('bautismo');
        else if (norm.includes('comunion')) set.add('comunion');
        else if (norm.includes('confir')) set.add('confirmacion');
        else if (norm.includes('boda') || norm.includes('matrimonio')) set.add('matrimonio');
      });
      
      return [...set].sort().join(' + ');
    };

    // Contar combinaciones
    const combinacionesCount = {};
    Object.values(personaSacramentosMap).forEach(tiposSet => {
      const key = sacramentoSet([...tiposSet]);
      if (key) combinacionesCount[key] = (combinacionesCount[key] || 0) + 1;
    });

    const combinaciones = Object.entries(combinacionesCount)
      .map(([combinacion, cantidad]) => {
        const sacramentos = combinacion.split(' + ');
        let color = '#6b7280'; // default
        if (sacramentos.length === 1) {
          if (sacramentos.includes('bautismo')) color = '#0f49bd';
          else if (sacramentos.includes('comunion')) color = '#8b5cf6';
          else if (sacramentos.includes('confirmacion')) color = '#c99c33';
          else if (sacramentos.includes('matrimonio')) color = '#10b981';
        } else {
          // Para combinaciones múltiples, usar un color distintivo
          color = '#ec4899'; // rosa para combinaciones
        }

        return {
          combinacion: combinacion
            .replace('bautismo', 'Bautismo')
            .replace('comunion', 'Primera Comunión')
            .replace('confirmacion', 'Confirmación')
            .replace('matrimonio', 'Matrimonio'),
          cantidad,
          color,
          sacramentos
        };
      })
      .sort((a, b) => b.cantidad - a.cantidad);

    res.json({
      kpis: {
        personas: totalPersonas,
        sacramentos: totalSacramentos,
        parroquias: totalParroquias
      },
      timeline,
      combinaciones
    });

  } catch (error) {
    console.error('Error en dashboard stats:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

module.exports = { getDashboardStats };