// middlewares/busqueda.js
const { Op, literal } = require('sequelize');

const generarCondicionesBusqueda = (searchTerm, camposBusqueda) => {
  if (!searchTerm || !camposBusqueda || camposBusqueda.length === 0) {
    return {};
  }

  const termino = searchTerm.trim().toLowerCase();

  const esNumero = /^\d+$/.test(termino); // solo dígitos
  const esFecha = /^\d{4}(-\d{1,2}){0,2}$/.test(termino); // YYYY / YYYY-MM / YYYY-MM-DD

  const condiciones = [];

  camposBusqueda.forEach(campo => {
    const esFechaCampo = campo.includes("fecha");
    const esNumericoCampo = campo.includes("numero") || campo.startsWith("id_");
    const esCICampo = campo.includes("ci") || campo.includes("carnet");

    //  BUSQUEDA NUMÉRICA
    if (esNumero) {
      if (esCICampo || esNumericoCampo) {
        condiciones.push(
          literal(`unaccent(LOWER(CAST(${campo} AS TEXT))) LIKE unaccent(LOWER('%${termino}%'))`)
        );
      }
      return;
    }

    //  BUSQUEDA DE FECHA
    if (esFecha) {
      if (esFechaCampo) {
        condiciones.push(
          literal(`CAST(${campo} AS TEXT) ILIKE '%${termino}%'`)
        );
      }
      return;
    }

    //  BUSQUEDA TEXTO (general)
    // Aquí incluimos CI porque es VARCHAR
    if (!esFechaCampo) {
      condiciones.push(
        literal(`unaccent(LOWER(CAST(${campo} AS TEXT))) LIKE unaccent(LOWER('%${termino}%'))`)
      );
    }
  });

  // fallback seguro
  if (condiciones.length === 0) {
    condiciones.push(literal("false"));
  }

  return { [Op.or]: condiciones };
};


const generarCondicionesBusquedaDifusa = (searchTerm, camposBusqueda, umbralSimilitud = 0.3) => {
  if (!searchTerm || !camposBusqueda || camposBusqueda.length === 0) {
    return {};
  }

  const terminoNormalizado = searchTerm.trim().toLowerCase();
  
  const condicionesSimilitud = camposBusqueda.map(campo => 
    literal(`similarity(unaccent(LOWER(CAST(${campo} AS TEXT))), unaccent(LOWER('${terminoNormalizado}'))) > ${umbralSimilitud}`)
  );

  return {
    [Op.or]: condicionesSimilitud
  };
};

const generarCondicionesFiltrado = (filtros) => {
  const where = {};

  const camposFecha = [
    'fecha_nacimiento',
    'fecha_sacramento',
    'fecha_registro',
    'fecha_actualizacion'
  ];

  const camposNumericos = [
    'numero',
    'numero_acta'
  ];

  Object.keys(filtros).forEach(key => {
    const valor = filtros[key];
    
    if (valor === null || valor === undefined || valor === '') {
      return;
    }
    if (key.endsWith('_desde')) {
      const campoBase = key.replace('_desde', '');
      if (!where[campoBase]) {
        where[campoBase] = {};
      }
      where[campoBase][Op.gte] = valor;
      return; 
    } 
    
    if (key.endsWith('_hasta')) {
      const campoBase = key.replace('_hasta', '');
      if (!where[campoBase]) {
        where[campoBase] = {};
      }
      where[campoBase][Op.lte] = valor;
      return; 
    }

    if (typeof valor === 'boolean' || valor === 'true' || valor === 'false') {
      where[key] = valor === 'true' || valor === true;
      return;
    }
    if (Array.isArray(valor)) {
      where[key] = {
        [Op.in]: valor
      };
      return;
    }
    if (camposFecha.includes(key)) {
      where[key] = valor;
      return;
    }

    if (camposNumericos.includes(key)) {
      const numeroParseado = parseInt(valor);
      if (!isNaN(numeroParseado)) {
        where[key] = numeroParseado;
      }
      return;
    }

    if (key.includes('_id') || key.startsWith('id_')) {
      const idParseado = parseInt(valor);
      if (!isNaN(idParseado)) {
        where[key] = idParseado;
      }
      return;
    }

    if (typeof valor === 'string') {
      where[key] = {
        [Op.iLike]: `%${valor}%`
      };
      return;
    }

    // Default
    where[key] = valor;
  });

  return where;
};


const combinarCondiciones = (search, camposBusqueda, filtros, usarBusquedaDifusa = false) => {
  let condicionesBusqueda = {};
  
  if (search && camposBusqueda) {
    if (usarBusquedaDifusa) {
      condicionesBusqueda = generarCondicionesBusquedaDifusa(search, camposBusqueda);
    } else {
      condicionesBusqueda = generarCondicionesBusqueda(search, camposBusqueda);
    }
  }
  
  const condicionesFiltros = generarCondicionesFiltrado(filtros);

  if (Object.keys(condicionesBusqueda).length > 0 && Object.keys(condicionesFiltros).length > 0) {
    return {
      [Op.and]: [
        condicionesBusqueda,
        condicionesFiltros
      ]
    };
  }

  return {
    ...condicionesBusqueda,
    ...condicionesFiltros
  };
};


const sanitizarBusqueda = (termino) => {
  if (!termino) return '';
  
  return termino
    .replace(/'/g, "''")  
    .replace(/\\/g, '\\\\') 
    .trim();
};


const validarPaginacion = (page, limit) => {
  const validPage = parseInt(page) || 1;
  const validLimit = parseInt(limit) || 10;
  
  const maxLimit = 100;
  const minLimit = 1;
  
  return {
    page: validPage < 1 ? 1 : validPage,
    limit: validLimit > maxLimit ? maxLimit : (validLimit < minLimit ? minLimit : validLimit)
  };
};


const construirRespuestaPaginada = (rows, count, page, limit, filtrosAplicados = {}) => {
  return {
    ok: true,
    data: rows,
    pagination: {
      totalItems: count,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      itemsPerPage: limit,
      hasNextPage: page < Math.ceil(count / limit),
      hasPreviousPage: page > 1
    },
    filtros_aplicados: filtrosAplicados
  };
};

module.exports = {
  generarCondicionesBusqueda,
  generarCondicionesBusquedaDifusa,
  generarCondicionesFiltrado,
  combinarCondiciones,
  sanitizarBusqueda,
  validarPaginacion,
  construirRespuestaPaginada
};