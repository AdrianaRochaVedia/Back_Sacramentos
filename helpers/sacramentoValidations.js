const { Op, Sequelize } = require('sequelize');
const Persona         = require('../models/Persona');
const PersonaSacramento = require('../models/PersonaSacramento');

// ---------------------------------------------------------------------------
// IDs de roles y tipos — deben coincidir con tu BD
// ---------------------------------------------------------------------------
const ROL = {
  BAUTIZADO:   1,
  ESPOSO:      2,
  ESPOSA:      3,
  CONFIRMADO:  4,
  PADRINO:     5,
  MINISTRO:    7,
  COMULGADO:   8,
};

const TIPO = {
  BAUTIZO:      1,
  MATRIMONIO:   2,
  COMUNION:     3,
};

// Roles que necesita tener un PADRINO antes de serlo
const ROLES_REQUERIDOS_PADRINO   = [ROL.BAUTIZADO];
// Roles que necesita tener un MINISTRO antes de serlo
const ROLES_REQUERIDOS_MINISTRO  = [ROL.BAUTIZADO, ROL.CONFIRMADO];

// ---------------------------------------------------------------------------
// Helpers internos
// ---------------------------------------------------------------------------

/** Devuelve la fecha de nacimiento de una persona o lanza error si no existe */
const getFechaNacimiento = async (persona_id) => {
  const persona = await Persona.findByPk(persona_id, {
    attributes: ['id_persona', 'nombre', 'apellido_paterno', 'fecha_nacimiento'],
  });
  if (!persona) throw new Error(`Persona con id ${persona_id} no encontrada`);
  return { persona, fecha: persona.fecha_nacimiento ? new Date(persona.fecha_nacimiento) : null };
};

/**
 * Devuelve la fecha del sacramento más reciente de una persona para un rol dado,
 * o null si no lo tiene.
 */
const getFechaSacramento = async (persona_id, rol_id) => {
  const rel = await PersonaSacramento.findOne({
    where: { persona_id_persona: persona_id, rol_sacramento_id_rol_sacra: rol_id },
    include: [{ association: 'sacramento', attributes: ['fecha_sacramento'] }],
    order: [[Sequelize.literal('"sacramento"."fecha_sacramento"'), 'ASC']],
  });
  return rel?.sacramento?.fecha_sacramento
    ? new Date(rel.sacramento.fecha_sacramento)
    : null;
};

/** Calcula la edad en años en una fecha dada */
const calcularEdad = (fechaNacimiento, enFecha) => {
  const diff = enFecha - fechaNacimiento;
  return Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25));
};

/** Formatea una fecha como DD/MM/YYYY para mensajes de error */
const fmt = (fecha) =>
  new Date(fecha).toLocaleDateString('es-BO', {
    day: '2-digit', month: '2-digit', year: 'numeric',
  });

// ---------------------------------------------------------------------------
// Validación 1 — formato de relaciones (síncrona)
// ---------------------------------------------------------------------------
const validarRelaciones = (relaciones) => {
  if (!Array.isArray(relaciones) || relaciones.length === 0) {
    throw new Error('Debe incluir al menos una relación (persona + rol)');
  }
  relaciones.forEach((rel, i) => {
    if (!rel.persona_id)       throw new Error(`Relación ${i + 1}: falta persona_id`);
    if (!rel.rol_sacramento_id) throw new Error(`Relación ${i + 1}: falta rol_sacramento_id`);
  });
};

// ---------------------------------------------------------------------------
// Validación 2 — reglas de fechas y lógica (asíncrona)
// ---------------------------------------------------------------------------
const validarFechasSacramento = async ({ tipo_sacramento_id_tipo, fecha_sacramento, relaciones }) => {
  const fechaSacramento = new Date(fecha_sacramento);
  const hoy = new Date();
  hoy.setHours(23, 59, 59, 999); // permite el día de hoy

  // ── Regla global: no fechas futuras ──────────────────────────────────────
  if (fechaSacramento > hoy) {
    throw new Error('La fecha del sacramento no puede ser futura');
  }

  const tipo = Number(tipo_sacramento_id_tipo);

  // Persona principal según tipo
  const rolPrincipal = {
    [TIPO.BAUTIZO]:    ROL.BAUTIZADO,
    [TIPO.COMUNION]:   ROL.COMULGADO,
    [TIPO.MATRIMONIO]: null, // matrimonio tiene esposo Y esposa
  };

  // ── Validaciones por persona según su rol ────────────────────────────────
  for (const rel of relaciones) {
    const { persona_id, rol_sacramento_id } = rel;
    const rolId = Number(rol_sacramento_id);

    const { persona, fecha: fechaNac } = await getFechaNacimiento(persona_id);
    const nombrePersona = `${persona.nombre} ${persona.apellido_paterno}`;

    // ── Regla: sacramento posterior a nacimiento ─────────────────────────
    if (fechaNac && fechaSacramento <= fechaNac) {
      throw new Error(
        `${nombrePersona}: la fecha del sacramento (${fmt(fechaSacramento)}) ` +
        `debe ser posterior a su fecha de nacimiento (${fmt(fechaNac)})`
      );
    }

    // ── Reglas por rol ───────────────────────────────────────────────────

    // COMULGADO — debe tener bautizo previo al sacramento
    if (rolId === ROL.COMULGADO) {
      const fechaBautizo = await getFechaSacramento(persona_id, ROL.BAUTIZADO);
      if (!fechaBautizo) {
        throw new Error(`${nombrePersona}: debe estar bautizado antes de recibir la Primera Comunión`);
      }
      if (fechaBautizo >= fechaSacramento) {
        throw new Error(
          `${nombrePersona}: su bautizo (${fmt(fechaBautizo)}) debe ser anterior ` +
          `a la Primera Comunión (${fmt(fechaSacramento)})`
        );
      }
    }

    // ESPOSO / ESPOSA — debe tener bautizo Y comunión previos, y ser mayor de 18
    if (rolId === ROL.ESPOSO || rolId === ROL.ESPOSA) {
      const label = rolId === ROL.ESPOSO ? 'Esposo' : 'Esposa';

      // Edad mínima
      if (fechaNac) {
        const edad = calcularEdad(fechaNac, fechaSacramento);
        if (edad < 18) {
          throw new Error(
            `${label} ${nombrePersona}: debe tener al menos 18 años en la fecha del matrimonio ` +
            `(tiene ${edad} años)`
          );
        }
      }

      // Bautizo previo
      const fechaBautizo = await getFechaSacramento(persona_id, ROL.BAUTIZADO);
      if (!fechaBautizo) {
        throw new Error(`${label} ${nombrePersona}: debe estar bautizado antes del matrimonio`);
      }
      if (fechaBautizo >= fechaSacramento) {
        throw new Error(
          `${label} ${nombrePersona}: su bautizo (${fmt(fechaBautizo)}) debe ser anterior ` +
          `al matrimonio (${fmt(fechaSacramento)})`
        );
      }

      // Comunión previa
      const fechaComunion = await getFechaSacramento(persona_id, ROL.COMULGADO);
      if (!fechaComunion) {
        throw new Error(`${label} ${nombrePersona}: debe haber recibido la Primera Comunión antes del matrimonio`);
      }
      if (fechaComunion >= fechaSacramento) {
        throw new Error(
          `${label} ${nombrePersona}: su Primera Comunión (${fmt(fechaComunion)}) debe ser anterior ` +
          `al matrimonio (${fmt(fechaSacramento)})`
        );
      }
    }

    // PADRINO — debe tener bautizo previo al sacramento en que es padrino
    if (rolId === ROL.PADRINO) {
      const fechaBautizo = await getFechaSacramento(persona_id, ROL.BAUTIZADO);
      if (!fechaBautizo) {
        throw new Error(`Padrino ${nombrePersona}: debe estar bautizado antes de participar como padrino`);
      }
      if (fechaBautizo >= fechaSacramento) {
        throw new Error(
          `Padrino ${nombrePersona}: su bautizo (${fmt(fechaBautizo)}) debe ser anterior ` +
          `al sacramento en que participa (${fmt(fechaSacramento)})`
        );
      }
    }

    // MINISTRO — debe tener bautizo Y confirmación previos
    if (rolId === ROL.MINISTRO) {
      const fechaBautizo     = await getFechaSacramento(persona_id, ROL.BAUTIZADO);
      const fechaConfirmacion = await getFechaSacramento(persona_id, ROL.CONFIRMADO);

      if (!fechaBautizo) {
        throw new Error(`Ministro ${nombrePersona}: debe estar bautizado antes de participar como ministro`);
      }
      if (fechaBautizo >= fechaSacramento) {
        throw new Error(
          `Ministro ${nombrePersona}: su bautizo (${fmt(fechaBautizo)}) debe ser anterior ` +
          `al sacramento en que participa (${fmt(fechaSacramento)})`
        );
      }
      if (!fechaConfirmacion) {
        throw new Error(`Ministro ${nombrePersona}: debe estar confirmado antes de participar como ministro`);
      }
      if (fechaConfirmacion >= fechaSacramento) {
        throw new Error(
          `Ministro ${nombrePersona}: su confirmación (${fmt(fechaConfirmacion)}) debe ser anterior ` +
          `al sacramento en que participa (${fmt(fechaSacramento)})`
        );
      }
    }
  }
};

module.exports = { validarRelaciones, validarFechasSacramento };