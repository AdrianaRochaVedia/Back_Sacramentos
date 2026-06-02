// services/opensearch.service.js
// Servicio centralizado para todas las operaciones con OpenSearch.
// Si OPENSEARCH_ENDPOINT no esta configurado, o si la conexion falla,
// todas las funciones degradan de forma silenciosa: los datos siguen
// guardandose en PostgreSQL y se avisa por consola.

const OPENSEARCH_DISPONIBLE = !!(
  process.env.OPENSEARCH_ENDPOINT &&
  process.env.OPENSEARCH_USERNAME &&
  process.env.OPENSEARCH_PASSWORD
);

const INDICE = 'sacramentos';

// Mensaje unico que se muestra una sola vez al arrancar
if (!OPENSEARCH_DISPONIBLE) {
  console.warn(
    '[OpenSearch] Las variables OPENSEARCH_ENDPOINT / OPENSEARCH_USERNAME / OPENSEARCH_PASSWORD ' +
    'no estan configuradas. Las busquedas se realizaran directamente sobre PostgreSQL. ' +
    'Si ya tienes datos previos y quieres indexarlos ejecuta: node sync-opensearch.js'
  );
}

// ---------------------------------------------------------------------------
// Helpers internos
// ---------------------------------------------------------------------------

/**
 * Devuelve el cliente de OpenSearch o null si no esta disponible.
 * El require se hace en tiempo de ejecucion para no romper el arranque
 * si el paquete no puede conectarse.
 */
function obtenerCliente() {
  if (!OPENSEARCH_DISPONIBLE) return null;
  try {
    const { opensearch } = require('../config/aws');
    return opensearch;
  } catch (err) {
    console.error('[OpenSearch] No se pudo obtener el cliente:', err.message);
    return null;
  }
}

/**
 * Wrapper comun para indexar / actualizar un documento.
 * Devuelve true si tuvo exito, false si fallo o no esta disponible.
 */
async function indexarDocumento(id, body) {
  const cliente = obtenerCliente();
  if (!cliente) return false;

  try {
    await cliente.index({
      index: INDICE,
      id: id.toString(),
      body
    });
    console.log(`[OpenSearch] Documento #${id} indexado correctamente.`);
    return true;
  } catch (err) {
    console.error(
      `[OpenSearch] Error al indexar documento #${id}:`, err.message,
      '\nSugerencia: si los datos del indice quedaron desactualizados ejecuta: node sync-opensearch.js'
    );
    return false;
  }
}

// ---------------------------------------------------------------------------
// Funciones exportadas
// ---------------------------------------------------------------------------

/**
 * Indexa o actualiza un sacramento en OpenSearch.
 *
 * @param {object} params
 * @param {number} params.id_sacramento
 * @param {string} params.foja
 * @param {number} params.numero
 * @param {string} params.fecha_sacramento
 * @param {number} params.tipo_sacramento_id
 * @param {number|null} params.parroquia_id
 * @param {string} [params.texto_ocr]
 * @param {string} [params.personas_involucradas]
 */
async function indexarSacramento({
  id_sacramento,
  foja,
  numero,
  fecha_sacramento,
  tipo_sacramento_id,
  parroquia_id,
  texto_ocr = '',
  personas_involucradas = ''
}) {
  const guardado = await indexarDocumento(id_sacramento, {
    id_sacramento,
    foja,
    numero: Number(numero),
    fecha_sacramento,
    tipo_sacramento_id: Number(tipo_sacramento_id),
    parroquia_id: parroquia_id ? Number(parroquia_id) : null,
    texto_ocr,
    personas_involucradas: personas_involucradas.trim()
  });

  if (!guardado) {
    console.log(
      `[OpenSearch] Sacramento #${id_sacramento} guardado solo en PostgreSQL ` +
      '(OpenSearch no disponible o con error).'
    );
  }
}

/**
 * Busqueda de texto libre sobre el indice de sacramentos.
 * Devuelve { fuente, ids } donde fuente es 'opensearch' o 'ninguna'.
 * Cuando OpenSearch no esta disponible devuelve fuente:'no_disponible'
 * para que el controlador haga su propia busqueda en Postgres.
 *
 * @param {string} textoBusqueda
 * @param {number} [limite=100]
 * @returns {Promise<{ fuente: string, ids: number[] }>}
 */
async function buscarPorTextoLibre(textoBusqueda, limite = 100) {
  const cliente = obtenerCliente();

  if (!cliente) {
    console.log('[OpenSearch] Busqueda de texto libre realizada sobre PostgreSQL (OpenSearch no disponible).');
    return { fuente: 'no_disponible', ids: [] };
  }

  try {
    const respuesta = await cliente.search({
      index: INDICE,
      body: {
        size: limite,
        query: {
          multi_match: {
            query: textoBusqueda.trim(),
            fields: ['texto_ocr', 'personas_involucradas', 'foja'],
            fuzziness: 'AUTO'
          }
        }
      }
    });

    const hits = respuesta.body.hits.hits;
    const ids = hits.map(h => h._source.id_sacramento);

    console.log(`[OpenSearch] Busqueda de texto libre realizada con OpenSearch. Resultados: ${ids.length}`);
    return { fuente: 'opensearch', ids };
  } catch (err) {
    console.error(
      '[OpenSearch] Error en busqueda de texto libre:', err.message,
      '\nSugerencia: verifica la conexion o ejecuta: node sync-opensearch.js'
    );
    return { fuente: 'error', ids: [] };
  }
}

/**
 * Busqueda filtrada por persona y tipo de sacramento.
 * Devuelve { fuente, ids, total }.
 *
 * @param {object} params
 * @param {number}  params.tipo_sacramento_id
 * @param {string}  [params.textoPersona]
 * @param {string}  [params.documentoIdentidad]
 * @param {number}  [params.page=1]
 * @param {number}  [params.limit=10]
 * @returns {Promise<{ fuente: string, ids: number[], total: number }>}
 */
async function buscarPorPersonaYTipo({
  tipo_sacramento_id,
  textoPersona = '',
  documentoIdentidad = '',
  page = 1,
  limit = 10
}) {
  const cliente = obtenerCliente();

  if (!cliente) {
    console.log('[OpenSearch] Busqueda por persona realizada sobre PostgreSQL (OpenSearch no disponible).');
    return { fuente: 'no_disponible', ids: [], total: 0 };
  }

  try {
    const mustClauses = [
      { match: { tipo_sacramento_id: Number(tipo_sacramento_id) } }
    ];

    if (textoPersona.trim().length > 0) {
      mustClauses.push({
        match: {
          personas_involucradas: {
            query: textoPersona.trim(),
            fuzziness: 'AUTO'
          }
        }
      });
    }

    if (documentoIdentidad) {
      mustClauses.push({
        multi_match: {
          query: documentoIdentidad,
          fields: ['texto_ocr', 'personas_involucradas']
        }
      });
    }

    const offset = (page - 1) * limit;

    const respuesta = await cliente.search({
      index: INDICE,
      body: {
        from: offset,
        size: limit,
        query: { bool: { must: mustClauses } }
      }
    });

    const hits = respuesta.body.hits.hits;
    const total = respuesta.body.hits.total.value;
    const ids = hits.map(h => h._source.id_sacramento);

    console.log(`[OpenSearch] Busqueda por persona realizada con OpenSearch. Resultados: ${total}`);
    return { fuente: 'opensearch', ids, total };
  } catch (err) {
    console.error(
      '[OpenSearch] Error en busqueda por persona:', err.message,
      '\nSugerencia: verifica la conexion o ejecuta: node sync-opensearch.js'
    );
    return { fuente: 'error', ids: [], total: 0 };
  }
}

/**
 * Indica si OpenSearch esta configurado (independientemente de si la
 * conexion en este momento es exitosa).
 */
function opensearchConfigurado() {
  return OPENSEARCH_DISPONIBLE;
}

module.exports = {
  indexarSacramento,
  buscarPorTextoLibre,
  buscarPorPersonaYTipo,
  opensearchConfigurado
};