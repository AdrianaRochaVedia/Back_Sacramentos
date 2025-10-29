// middlewares/busqueda.js
const { Op, literal } = require('sequelize');

const generarCondicionesBusqueda = (searchTerm, camposBusqueda) => {
  if (!searchTerm || !camposBusqueda || camposBusqueda.length === 0) {
    return {};
  }

  const terminoNormalizado = searchTerm.trim().toLowerCase();

  const condicionesBasicas = camposBusqueda.map(campo => ({
    [campo]: {
      [Op.iLike]: `%${terminoNormalizado}%`
    }
  }));

  const condicionesUnaccent = camposBusqueda.map(campo => 
    literal(`unaccent(LOWER(${campo})) LIKE unaccent(LOWER('%${terminoNormalizado}%'))`)
  );

  return {
    [Op.or]: [
      ...condicionesBasicas,
      ...condicionesUnaccent
    ]
  };
};


const generarCondicionesBusquedaDifusa = (searchTerm, camposBusqueda, umbralSimilitud = 0.3) => {
  if (!searchTerm || !camposBusqueda || camposBusqueda.length === 0) {
    return {};
  }

  const terminoNormalizado = searchTerm.trim().toLowerCase();
  
  const condicionesSimilitud = camposBusqueda.map(campo => 
    literal(`similarity(unaccent(LOWER(${campo})), unaccent(LOWER('${terminoNormalizado}'))) > ${umbralSimilitud}`)
  );

  return {
    [Op.or]: condicionesSimilitud
  };
};

const generarCondicionesFiltrado = (filtros) => {
  const where = {};

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
    } 
    else if (key.endsWith('_hasta')) {
      const campoBase = key.replace('_hasta', '');
      if (!where[campoBase]) {
        where[campoBase] = {};
      }
      where[campoBase][Op.lte] = valor;
    }

    else if (typeof valor === 'boolean' || valor === 'true' || valor === 'false') {
      where[key] = valor === 'true' || valor === true;
    }

    else if (Array.isArray(valor)) {
      where[key] = {
        [Op.in]: valor
      };
    }

    else if (!isNaN(valor) && key.includes('_id')) {
      where[key] = parseInt(valor);
    }

    else if (typeof valor === 'string') {
      where[key] = {
        [Op.iLike]: `%${valor}%`
      };
    }
    else {
      where[key] = valor;
    }
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