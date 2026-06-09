const { sequelize } = require('../database/config');
const { QueryTypes } = require('sequelize');

const T_PARROQUIA   = 'institucion_parroquia';
const T_SACRAMENTO  = 'sacramento';
const T_TIPO        = 'tipo_sacramento';
const T_PS          = 'persona_sacramento';

exports.getResumenMapa = async (req, res) => {
  try {
    // Parroquias con conteos por tipo de sacramento
    const parroquias = await sequelize.query(
      `
      SELECT
        p.id_parroquia,
        p.nombre,
        p.direccion,
        p.latitud,
        p.longitud,
        COUNT(DISTINCT s.id_sacramento)::int                                          AS total_sacramentos,
        COUNT(DISTINCT CASE WHEN t.nombre ILIKE 'bautiz%' OR t.nombre ILIKE 'bautism%'
              THEN s.id_sacramento END)::int                                          AS bautismos,
        COUNT(DISTINCT CASE WHEN t.nombre ILIKE 'matri%' OR t.nombre ILIKE 'boda%'
              THEN s.id_sacramento END)::int                                          AS matrimonios,
        COUNT(DISTINCT CASE WHEN t.nombre ILIKE 'confirm%'
              THEN s.id_sacramento END)::int                                          AS confirmaciones,
        COUNT(DISTINCT CASE WHEN t.nombre ILIKE 'comuni%'
              THEN s.id_sacramento END)::int                                          AS comuniones,
        COUNT(DISTINCT ps.persona_id_persona)::int                                   AS total_fieles
      FROM ${T_PARROQUIA} p
      LEFT JOIN ${T_SACRAMENTO} s  ON s.institucion_parroquia_id_parroquia = p.id_parroquia
                                   AND s.activo = true
      LEFT JOIN ${T_TIPO}       t  ON t.id_tipo = s.tipo_sacramento_id_tipo
      LEFT JOIN ${T_PS}         ps ON ps.sacramento_id_sacramento = s.id_sacramento
      GROUP BY p.id_parroquia, p.nombre, p.direccion, p.latitud, p.longitud
      ORDER BY p.nombre ASC;
      `,
      { type: QueryTypes.SELECT }
    );

    const sinCoordenadas = parroquias.filter(p => p.latitud === null || p.longitud === null).length;

    res.json({
      ok: true,
      parroquias,
      meta: {
        total: parroquias.length,
        sin_coordenadas: sinCoordenadas,
      },
    });
  } catch (err) {
    console.error('mapa error:', err);
    res.status(500).json({ ok: false, msg: 'Error al obtener resumen del mapa' });
  }
};
