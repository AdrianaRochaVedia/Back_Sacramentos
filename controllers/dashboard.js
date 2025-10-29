const { sequelize } = require('../database/config');
const { QueryTypes } = require('sequelize');

/* ===========================
   CONFIG (según tu esquema real)
=========================== */
const T_PERSONA            = 'persona';
const T_PARROQUIA          = 'institucion_parroquia';
const T_PS                 = 'persona_sacramento';          // hechos (persona ↔ sacramento)
const T_SACRAMENTO         = 'sacramento';                  // hechos (con fechas y parroquia)
const T_TIPO               = 'tipo_sacramento';             // catálogo de tipos

const S_ID                 = 'id_sacramento';
const S_FECHA              = 'fecha_sacramento';
const S_PARROQUIA_ID       = 'institucion_parroquia_id_parroquia';
const S_TIPO_ID            = 'tipo_sacramento_id_tipo';
const S_USUARIO_ID         = 'usuario_id_usuario';

const PS_PERSONA_ID        = 'persona_id_persona';
const PS_SACRAMENTO_ID     = 'sacramento_id_sacramento';

const TIPO_NOMBRE          = 'nombre';

/* ===========================
   Helpers
=========================== */
function toDate(v) {
  if (!v) return null;
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? null : d;
}
function defaultRange(start_date, end_date, fallbackDays = 365) {
  const providedStart = !!start_date;
  const providedEnd = !!end_date;

  let start = toDate(start_date);
  let end = toDate(end_date);

  const now = new Date();

  if (!start && !end) {
    // No dates provided -> we will NOT apply a date filter; still return a sane window.
    // Keep a wide window just for replacements to exist (won't be used).
    end = now;
    start = new Date(1900, 0, 1);
    start.setHours(0,0,0,0);
    end.setHours(23,59,59,999);
    return { start, end, apply: false };
  }

  if (start && !end) end = now;
  if (!start && end) {
    start = new Date(end);
    start.setDate(end.getDate() - fallbackDays);
  }

  start.setHours(0,0,0,0);
  end.setHours(23,59,59,999);
  return { start, end, apply: true };
}
function normalizeTipos(t) {
  if (!t) return null;
  if (Array.isArray(t)) return t.filter(Boolean);
  return String(t).split(',').map(s => s.trim()).filter(Boolean);
}

// Normaliza strings (minúsculas + sin tildes) para comparar nombres de tipos
function normalizeStr(str) {
  return (str || '')
    .toString()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, ''); // quita diacríticos
}

// Mapa de alias comunes -> nombre canónico esperado en BD
// Se usa sólo como ayuda; la resolución final se hace contra los nombres realmente existentes.
const TYPE_ALIASES = {
  boda: 'Matrimonio',
  matrimonio: 'Matrimonio',
  confirmacion: 'Confirmación',
  confirmación: 'Confirmación',
  comunion: 'Comunión',
  'primera comunion': 'Comunión',
  bautismo: 'Bautizo',
  bautizo: 'Bautizo',
};

/**
 * Resuelve los valores de ?tipo=... a nombres EXACTOS existentes en tipo_sacramento.nombre,
 * haciendo la comparación sin tildes ni mayúsculas y aceptando alias.
 * Devuelve array de strings listos para usar en IN (:...tipos)
 */
async function resolveTiposFiltro(inputTipos) {
  if (!inputTipos || !inputTipos.length) return null;

  // Trae todos los nombres disponibles en la tabla de catálogo
  const rows = await sequelize.query(
    `SELECT ${TIPO_NOMBRE} AS nombre FROM ${T_TIPO};`,
    { type: QueryTypes.SELECT }
  );
  const disponibles = rows.map(r => r.nombre);
  const normDisponibles = disponibles.map(n => ({ raw: n, norm: normalizeStr(n) }));

  // Normaliza el input + aplica alias
  const buscados = inputTipos.map(v => {
    const raw = (TYPE_ALIASES[normalizeStr(v)] || v);
    return { raw, norm: normalizeStr(raw) };
  });

  // Match exactos por forma normalizada
  const result = new Set();
  for (const b of buscados) {
    // 1) Coincidencia exacta por normalizado
    const hit = normDisponibles.find(d => d.norm === b.norm);
    if (hit) { result.add(hit.raw); continue; }
    // 2) Coincidencia por inclusión (ej. "comunion" encuentra "Primera Comunión")
    const incl = normDisponibles.find(d => d.norm.includes(b.norm) || b.norm.includes(d.norm));
    if (incl) { result.add(incl.raw); continue; }
  }

  return result.size ? Array.from(result) : null;
}

function appliedFiltersOut(q, start, end) {
  const { parish_id, tipo, user_id } = q || {};
  return {
    start_date: new Date(start).toISOString().slice(0,10),
    end_date: new Date(end).toISOString().slice(0,10),
    parish_id: parish_id ? Number(parish_id) : null,
    tipo: tipo || null,
    user_id: user_id ? Number(user_id) : null,
  };
}

// Mapea nombres a llaves del timeline
function keyOf(nombre) {
  const n = (nombre || '').toLowerCase();
  if (n.includes('baut')) return 'bautizo';
  if (n.includes('comun')) return 'comunion';
  if (n.includes('confirm')) return 'confirmacion';
  if (n.includes('matri') || n.includes('boda')) return 'matrimonio';
  return 'otro';
}

// Colores para combos comunes; si no está, genero uno estable
const COMBO_COLORS = {
  Bautizo: '#0f49bd',
  'Primera Comunión': '#10b981',
  Comunión: '#10b981',
  Comunion: '#10b981',
  Confirmación: '#f59e0b',
  Confirmacion: '#f59e0b',
  Matrimonio: '#ef4444',
  'Bautizo+Confirmación': '#8b5cf6',
  'Bautizo+Confirmacion': '#8b5cf6',
  'Bautizo+Comunión': '#06b6d4',
  'Bautizo+Comunion': '#06b6d4',
  'Confirmación+Matrimonio': '#d97706',
  'Confirmacion+Matrimonio': '#d97706',
  'Boda+Bautizo': '#ef4444',
};
// Normalizador SQL para tipo sacramento (para agrupaciones)
const SQL_TIPO_NORMALIZADO = `
  CASE
    WHEN t.${TIPO_NOMBRE} ILIKE 'bautiz%' OR t.${TIPO_NOMBRE} ILIKE 'bautism%' THEN 'Bautizo'
    WHEN t.${TIPO_NOMBRE} ILIKE 'comuni%' THEN 'Comunión'
    WHEN t.${TIPO_NOMBRE} ILIKE 'confirm%' THEN 'Confirmación'
    WHEN t.${TIPO_NOMBRE} ILIKE 'matri%' OR t.${TIPO_NOMBRE} ILIKE 'boda%' THEN 'Matrimonio'
    ELSE COALESCE(t.${TIPO_NOMBRE}, 'Desconocido')
  END
`;
function pickColor(key) {
  if (COMBO_COLORS[key]) return COMBO_COLORS[key];
  let hash = 0;
  for (let i = 0; i < key.length; i++) hash = key.charCodeAt(i) + ((hash << 5) - hash);
  const c = (hash & 0x00ffffff).toString(16).toUpperCase();
  return '#' + '000000'.substring(0, 6 - c.length) + c.substring(0, 6);
}

/* ===========================
   Controller
=========================== */
exports.getDashboardSummary = async (req, res) => {
  try {
    const { start, end, apply: applyDate } = defaultRange(req.query.start_date, req.query.end_date, 365);
    const parishId = req.query.parish_id ? Number(req.query.parish_id) : null;
    const userId   = req.query.user_id ? Number(req.query.user_id) : null;
    const tipos    = normalizeTipos(req.query.tipo);
    // Resolver a nombres reales en BD (tildes/case-insensitive + alias)
    const tiposResueltos = await resolveTiposFiltro(tipos);

    // WHERE base (sin filtro por tipo)
    const baseConds = [];
    const repl = { start, end };

    if (applyDate) baseConds.push(`s.${S_FECHA} BETWEEN :start AND :end`);
    if (parishId) { baseConds.push(`s.${S_PARROQUIA_ID} = :parishId`); repl.parishId = parishId; }
    if (userId)   { baseConds.push(`s.${S_USUARIO_ID} = :userId`);     repl.userId   = userId; }

    // WHERE strings must be empty when there are no conditions
    const WHERE_BASE = baseConds.length ? `WHERE ${baseConds.join(' AND ')}` : '';

    // WHERE con filtro por tipo (cuando corresponde)
    const whereTipoConds = [...baseConds];
    if (tiposResueltos && tiposResueltos.length) {
      // Expandimos IN (:tipo0, :tipo1, ...) para evitar problemas con :...tipos
      const tipPlaceholders = tiposResueltos.map((_, i) => `:tipo${i}`).join(', ');
      whereTipoConds.push(`t.${TIPO_NOMBRE} IN (${tipPlaceholders})`);
      tiposResueltos.forEach((val, i) => { repl[`tipo${i}`] = val; });
    }
    const WHERE_TIPO = whereTipoConds.length ? `WHERE ${whereTipoConds.join(' AND ')}` : '';

    /* ========== 1) KPIs ========== */
    const [{ personas }] = await sequelize.query(
      `SELECT COUNT(*)::int AS personas FROM ${T_PERSONA};`,
      { type: QueryTypes.SELECT }
    );

    const [{ parroquias }] = await sequelize.query(
      `SELECT COUNT(*)::int AS parroquias FROM ${T_PARROQUIA};`,
      { type: QueryTypes.SELECT }
    );

    // Si hay filtro por tipo, contamos con JOIN; si no, evitamos el JOIN para no perder filas
    let kpiSacramentosSql;
    if (tiposResueltos && tiposResueltos.length) {
      kpiSacramentosSql = `
        SELECT COUNT(*)::int AS sacramentos
        FROM ${T_SACRAMENTO} s
        LEFT JOIN ${T_TIPO} t ON t.id_tipo = s.${S_TIPO_ID}
        ${WHERE_TIPO};
      `;
    } else {
      kpiSacramentosSql = `
        SELECT COUNT(*)::int AS sacramentos
        FROM ${T_SACRAMENTO} s
        ${WHERE_BASE};
      `;
    }
    const [{ sacramentos }] = await sequelize.query(kpiSacramentosSql, {
      replacements: repl,
      type: QueryTypes.SELECT
    });

    /* ========== 2) Timeline por año y tipo ========== */
    const WHERE_FOR_TIMELINE = ( (tiposResueltos && tiposResueltos.length) || baseConds.length ) ? WHERE_TIPO : '';
    const timelineRows = await sequelize.query(
      `
      SELECT
        EXTRACT(YEAR FROM s.${S_FECHA})::int AS anio,
        COALESCE(t.${TIPO_NOMBRE}, 'Desconocido') AS tipo,
        COUNT(*)::int AS cantidad
      FROM ${T_SACRAMENTO} s
      LEFT JOIN ${T_TIPO} t ON t.id_tipo = s.${S_TIPO_ID}
      ${WHERE_FOR_TIMELINE}
      GROUP BY anio, COALESCE(t.${TIPO_NOMBRE}, 'Desconocido')
      ORDER BY anio ASC, tipo ASC;
      `,
      { replacements: repl, type: QueryTypes.SELECT }
    );

    // Armar salida del timeline
    const timelineMap = new Map();
    for (const r of timelineRows) {
      const year = String(r.anio);
      const key = keyOf(r.tipo);
      if (!timelineMap.has(year)) {
        timelineMap.set(year, {
          periodo: year,
          bautizo: 0,
          comunion: 0,
          confirmacion: 0,
          matrimonio: 0,
        });
      }
      const row = timelineMap.get(year);
      if (row[key] !== undefined) row[key] += r.cantidad;
    }
    const timeline = Array.from(timelineMap.values()).sort(
      (a, b) => Number(a.periodo) - Number(b.periodo)
    );

    /* ========== 3) Combinaciones por persona + año ========== */
    const WHERE_FOR_COMBOS = WHERE_FOR_TIMELINE;
    const combosRows = await sequelize.query(
      `
      WITH base AS (
        SELECT
          ps.${PS_PERSONA_ID}        AS id_persona,
          EXTRACT(YEAR FROM s.${S_FECHA})::int AS anio,
          ARRAY_AGG(DISTINCT COALESCE(t.${TIPO_NOMBRE}, 'Desconocido') ORDER BY COALESCE(t.${TIPO_NOMBRE}, 'Desconocido')) AS tipos
        FROM ${T_PS} ps
        JOIN ${T_SACRAMENTO} s ON s.${S_ID} = ps.${PS_SACRAMENTO_ID}
        LEFT JOIN ${T_TIPO} t ON t.id_tipo = s.${S_TIPO_ID}
        ${WHERE_FOR_COMBOS}
        GROUP BY ps.${PS_PERSONA_ID}, anio
      )
      SELECT
        anio,
        array_to_string(tipos, '+') AS combinacion,
        tipos
      FROM base;
      `,
      { replacements: repl, type: QueryTypes.SELECT }
    );

    // Contabilizar combinaciones globales
    const comboCount = new Map(); // key => { cantidad, tipos[] }
    for (const r of combosRows) {
      const label = r.combinacion || 'Sin datos';
      if (!comboCount.has(label)) {
        comboCount.set(label, { cantidad: 0, tipos: r.tipos });
      }
      comboCount.get(label).cantidad += 1;
    }
    const combinaciones = Array.from(comboCount.entries())
      .map(([label, info]) => ({
        combinacion: label,
        cantidad: info.cantidad,
        color: pickColor(label),
        sacramentos: info.tipos || [],
      }))
      .sort((a, b) => b.cantidad - a.cantidad);

    /* ========== Respuesta final ========== */
    res.json({
      ok: true,
      kpis: { personas, sacramentos, parroquias },
      timeline,
      combinaciones,
      applied_filters: {
        ...appliedFiltersOut(req.query, start, end),
        date_filter_applied: applyDate,
        tipo: tiposResueltos || null,
        resolved_tipos: tiposResueltos,
      },
    });
  } catch (err) {
    console.error('dashboard error:', err);
    res.status(500).json({ ok: false, msg: 'Error al construir el dashboard' });
  }
};