//node sync-opensearch.js
require('dotenv').config();
const { opensearch } = require('./config/aws');
// Asegúrate de que las rutas a tus modelos sean las correctas
const Sacramento = require('./models/Sacramento');
const PersonaSacramento = require('./models/PersonaSacramento');
const Persona = require('./models/Persona');

async function migrarDatosMasivos() {
    console.log('⏳ Obteniendo sacramentos de la base de datos PostgreSQL...');
    
    try {
        // 1. Traer todos los sacramentos con las personas involucradas
        const sacramentos = await Sacramento.findAll({
            where: { activo: true },
            include: [
                {
                    model: PersonaSacramento,
                    as: 'personaSacramentos',
                    include: [{ model: Persona, as: 'persona' }]
                }
            ]
        });

        console.log(`📦 Se encontraron ${sacramentos.length} sacramentos. Iniciando indexación en OpenSearch...`);

        // 2. Enviar uno por uno a OpenSearch
        for (const s of sacramentos) {
            // Unimos todos los nombres de los involucrados en un solo texto (Novios, Padrinos, Bautizados...)
            const nombresInvolucrados = s.personaSacramentos
                ? s.personaSacramentos.map(rel => {
                    return `${rel.persona.nombre} ${rel.persona.apellido_paterno} ${rel.persona.apellido_materno}`;
                  }).join(' ')
                : '';

            const carnetsInvolucrados = s.personaSacramentos
                ? s.personaSacramentos
                    .map(rel => (rel.persona.carnet_identidad || '').trim().toLowerCase())
                    .filter(Boolean)
                : [];

            await opensearch.index({
                index: 'sacramentos',
                id: s.id_sacramento.toString(),
                body: {
                    id_sacramento: s.id_sacramento,
                    foja: s.foja,
                    numero: Number(s.numero),
                    fecha_sacramento: s.fecha_sacramento,
                    tipo_sacramento_id: s.tipo_sacramento_id_tipo,
                    parroquia_id: s.institucion_parroquia_id_parroquia,
                    texto_ocr: '',
                    personas_involucradas: nombresInvolucrados.trim(),
                    carnets_involucrados: carnetsInvolucrados
                }
            });
        }

        console.log('✅ ¡Migración completada con éxito! OpenSearch ahora tiene todos tus datos.');
        process.exit(0);

    } catch (error) {
        console.error('❌ Error migrando datos:', error);
        process.exit(1);
    }
}

migrarDatosMasivos();