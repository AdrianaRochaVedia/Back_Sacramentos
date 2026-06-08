//node setup-opensearch.js
require('dotenv').config();
const { opensearch } = require('./config/aws');

async function setupIndex() {
  const indexName = 'sacramentos';

  try {
    // 1. Verificar si el índice ya existe
    const { body: exists } = await opensearch.indices.exists({ index: indexName });
    
    if (exists) {
      console.log(`El índice "${indexName}" ya existe. Borrándolo para recrearlo limpio...`);
      await opensearch.indices.delete({ index: indexName });
    }

    console.log(`Creando el índice "${indexName}"...`);
    
    // 2. Crear el índice con configuración para español
    await opensearch.indices.create({
      index: indexName,
      body: {
        settings: {
          analysis: {
            analyzer: {
              // Configuramos un analizador que ignora mayúsculas y tildes (asciifolding)
              spanish_analyzer: {
                type: 'custom',
                tokenizer: 'standard',
                filter: ['lowercase', 'asciifolding']
              }
            }
          }
        },
        mappings: {
          properties: {
            // Datos del Sacramento
            id_sacramento: { type: 'integer' },
            foja: { type: 'keyword' }, // keyword es mejor para búsquedas exactas cortas
            numero: { type: 'integer' },
            fecha_sacramento: { type: 'date' },
            tipo_sacramento_id: { type: 'integer' },
            parroquia_id: { type: 'integer' },
            
            // Datos del OCR (Texto crudo para buscar libremente)
            texto_ocr: { 
              type: 'text',
              analyzer: 'spanish_analyzer' // Usa el analizador en español
            },
            
            // Nombres de las personas involucradas (Novios, Bautizados, etc.)
            personas_involucradas: { 
              type: 'text',
              analyzer: 'spanish_analyzer' 
            },
            carnets_involucrados: { type: 'keyword' }
          }
        }
      }
    });

    console.log(`¡Éxito! El índice "${indexName}" ha sido creado y configurado correctamente en AWS OpenSearch.`);

  } catch (error) {
    console.error('Error al configurar OpenSearch:', error);
    if (error.meta && error.meta.body) {
       console.error('Detalle de AWS:', JSON.stringify(error.meta.body, null, 2));
    }
  }
}

// Ejecutar la función
setupIndex();