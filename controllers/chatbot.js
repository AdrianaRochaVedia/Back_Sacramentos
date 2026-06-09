// ──────────────────────────────────────────────
// 1. Instalar y requerir Groq: npm install groq-sdk
// ──────────────────────────────────────────────
const Groq = require('groq-sdk');
const { Op } = require('sequelize');

// ──────────────────────────────────────────────
// Importar los modelos y helpers que ya existen
// ──────────────────────────────────────────────
const Persona = require('../models/Persona');
const Sacramento = require('../models/Sacramento');
const TipoSacramento = require('../models/TipoSacramento');
const Parroquia = require('../models/Parroquia');
const PersonaSacramento = require('../models/PersonaSacramento');
const RolSacramento = require('../models/RolSacramento');
const { combinarCondiciones } = require('../middlewares/busqueda');

// ──────────────────────────────────────────────
// Inicializar cliente de Groq
// (Usando tu nombre de variable de entorno)
// ──────────────────────────────────────────────
const groq = new Groq({ apiKey: process.env.GROK_API_KEY });

// El SYSTEM_PROMPT se mantiene igual
const SYSTEM_PROMPT = `... tu prompt actual ...`;

// ──────────────────────────────────────────────
// DEFINICIÓN DE TOOLS (Formato estándar OpenAI/Groq)
// ──────────────────────────────────────────────
const tools = [
  {
    type: 'function',
    function: {
      name: 'buscar_persona',
      description: 'Busca personas registradas en la base de datos por nombre, apellidos o carnet de identidad. Úsala cuando el usuario mencione un nombre o número de CI.',
      parameters: {
        type: 'object',
        properties: {
          search: { type: 'string', description: 'Texto libre para búsqueda difusa en nombre, apellidos y carnet.' },
          nombre: { type: 'string', description: 'Nombre de pila de la persona.' },
          apellido_paterno: { type: 'string', description: 'Primer apellido.' },
          apellido_materno: { type: 'string', description: 'Segundo apellido.' },
          carnet_identidad: { type: 'string', description: 'Número de carnet de identidad (CI).' }
        }
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'buscar_sacramento',
      description: 'Busca registros sacramentales por foja, número de acta, fecha o tipo.',
      parameters: {
        type: 'object',
        properties: {
          search: { type: 'string', description: 'Texto libre para búsqueda en el motor híbrido.' },
          foja: { type: 'string', description: 'Número de foja del libro.' },
          numero: { type: 'string', description: 'Número de acta.' },
          fecha_sacramento: { type: 'string', description: 'Fecha del sacramento en formato YYYY-MM-DD.' },
          tipo_sacramento_id_tipo: { type: 'string', enum: ['1', '2', '3'], description: '1 = Bautizo, 2 = Matrimonio, 3 = Comunión.' }
        }
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'buscar_sacramento_por_persona',
      description: 'Busca los sacramentos de una persona específica usando su nombre o carnet.',
      parameters: {
        type: 'object',
        properties: {
          nombre: { type: 'string', description: 'Nombre de pila.' },
          apellido_paterno: { type: 'string', description: 'Primer apellido.' },
          apellido_materno: { type: 'string', description: 'Segundo apellido.' },
          ci: { type: 'string', description: 'Carnet de identidad.' },
          tipo_sacramento_id_tipo: { type: 'string', enum: ['1', '2', '3'], description: 'OBLIGATORIO. 1 = Bautizo, 2 = Matrimonio, 3 = Comunión.' }
        },
        required: ['tipo_sacramento_id_tipo']
      }
    }
  }
];

// ──────────────────────────────────────────────
// EJECUTORES DE TOOLS — llaman a la DB directamente
// ──────────────────────────────────────────────

/**
 * Ejecuta buscar_persona contra la BD.
 * Replica la lógica de getPersonas en persona.js.
 */
async function ejecutarBuscarPersona(args) {
  const { search, nombre, apellido_paterno, apellido_materno, carnet_identidad } = args;

  const camposBusqueda = [
    'nombre',
    'apellido_paterno',
    'apellido_materno',
    'carnet_identidad',
  ];

  const filtros = {
    nombre,
    apellido_paterno,
    apellido_materno,
    carnet_identidad,
    activo: true,
  };

  let whereConditions = combinarCondiciones(search, camposBusqueda, filtros);

  if (carnet_identidad && !search) {
    whereConditions = {
      ...whereConditions,
      carnet_identidad: { [Op.iLike]: `%${carnet_identidad}%` },
    };
  }

  const personas = await Persona.findAll({
    where: whereConditions,
    limit: 10,
    order: [
      ['apellido_paterno', 'ASC'],
      ['apellido_materno', 'ASC'],
      ['nombre', 'ASC'],
    ],
    attributes: [
      'id_persona',
      'nombre',
      'apellido_paterno',
      'apellido_materno',
      'carnet_identidad',
      'fecha_nacimiento',
      'lugar_nacimiento',
      'nombre_padre',
      'nombre_madre',
      'estado',
    ],
  });

  return personas.map((p) => p.get({ plain: true }));
}

/**
 * Ejecuta buscar_sacramento contra la BD.
 * Replica la lógica de getSacramentos en sacramentos.js.
 */
async function ejecutarBuscarSacramento(args) {
  const { search, foja, numero, fecha_sacramento, tipo_sacramento_id_tipo } = args;

  const camposBusqueda = ['foja', 'numero', 'observaciones'];

  const filtros = {
    foja,
    numero,
    fecha_sacramento,
    activo: true,
  };

  if (tipo_sacramento_id_tipo && tipo_sacramento_id_tipo !== 'undefined') {
    filtros.tipo_sacramento_id_tipo = Number(tipo_sacramento_id_tipo);
  }
  
  const whereConditions = combinarCondiciones(search, camposBusqueda, filtros);

  const sacramentos = await Sacramento.findAll({
    where: whereConditions,
    limit: 10,
    include: [
      { model: TipoSacramento, as: 'tipoSacramento', attributes: ['id_tipo', 'nombre'] },
      { model: Parroquia, as: 'parroquia', attributes: ['id_parroquia', 'nombre'] },
    ],
    order: [['fecha_sacramento', 'DESC']],
  });

  return sacramentos.map((s) => s.get({ plain: true }));
}

/**
 * Ejecuta buscar_sacramento_por_persona.
 * Replica la lógica de buscarSacramentosPorPersona en sacramentos.js.
 */
async function ejecutarBuscarSacramentoPorPersona(args) {
  const { nombre, apellido_paterno, apellido_materno, ci, tipo_sacramento_id_tipo } = args;

  // Construir condiciones de búsqueda de persona
  const condicionesPersona = { activo: true };
  if (nombre) condicionesPersona.nombre = { [Op.iLike]: `%${nombre}%` };
  if (apellido_paterno) condicionesPersona.apellido_paterno = { [Op.iLike]: `%${apellido_paterno}%` };
  if (apellido_materno) condicionesPersona.apellido_materno = { [Op.iLike]: `%${apellido_materno}%` };
  if (ci) condicionesPersona.carnet_identidad = { [Op.iLike]: `%${ci}%` };

  const personas = await Persona.findAll({
    where: condicionesPersona,
    attributes: ['id_persona'],
  });

  if (!personas.length) return [];

  const ids = personas.map((p) => p.id_persona);

  const condicionesSacramento = { activo: true };
  if (tipo_sacramento_id_tipo && tipo_sacramento_id_tipo !== 'undefined') {
    condicionesSacramento.tipo_sacramento_id_tipo = Number(tipo_sacramento_id_tipo)
    condicionesSacramento.activo =  true;
  }
  // Buscar sacramentos donde estas personas participen
  const personasSacramento = await PersonaSacramento.findAll({
    where: { persona_id_persona: { [Op.in]: ids } },
    include: [
      {
        model: Sacramento,
        as: 'sacramento',
        where: condicionesSacramento,
        include: [
          { model: TipoSacramento, as: 'tipoSacramento', attributes: ['id_tipo', 'nombre'] },
          { model: Parroquia, as: 'parroquia', attributes: ['id_parroquia', 'nombre'] },
        ],
      },
      {
        model: RolSacramento,
        as: 'rolSacramento',
        attributes: ['id_rol_sacra', 'nombre'],
      },
    ],
    limit: 10,
  });

  return personasSacramento.map((ps) => ps.get({ plain: true }));
}

// ──────────────────────────────────────────────
// LÓGICA DE BIFURCACIÓN — mapear tool call → respuesta estructurada
// ──────────────────────────────────────────────
async function ejecutarTool(toolName, toolArgs) {
  switch (toolName) {
    case 'buscar_persona': {
      const datos = await ejecutarBuscarPersona(toolArgs);
      if (!datos.length) {
        return {
          tipo_respuesta: 'texto',
          mensaje: 'No encontré personas con esos datos. Intenta con otro nombre o carnet.',
        };
      }
      return {
        tipo_respuesta: 'ui_cards_seleccion_persona',
        datos,
        mensaje: `Encontré ${datos.length} persona(s). Selecciona una para continuar.`,
      };
    }

    case 'buscar_sacramento': {
      const datos = await ejecutarBuscarSacramento(toolArgs);
      if (!datos.length) {
        return {
          tipo_respuesta: 'texto',
          mensaje: 'No encontré sacramentos con esos criterios. Intenta con otros datos.',
        };
      }
      return {
        tipo_respuesta: 'ui_cards_sacramento',
        datos,
        mensaje: `Encontré ${datos.length} sacramento(s).`,
      };
    }

    case 'buscar_sacramento_por_persona': {
      const datos = await ejecutarBuscarSacramentoPorPersona(toolArgs);
      if (!datos.length) {
        return {
          tipo_respuesta: 'texto',
          mensaje: 'No encontré sacramentos para esa persona con el tipo indicado.',
        };
      }
      return {
        tipo_respuesta: 'ui_cards_sacramento',
        datos,
        mensaje: `Encontré ${datos.length} sacramento(s) para esa persona.`,
      };
    }

    default:
      return {
        tipo_respuesta: 'texto',
        mensaje: 'Herramienta desconocida.',
      };
  }
}

// ──────────────────────────────────────────────
// CONTROLADOR PRINCIPAL ACTUALIZADO PARA GROQ
// ──────────────────────────────────────────────
const enviarMensaje = async (req, res) => {
  try {
    const { mensaje, historial = [] } = req.body;

    if (!mensaje?.trim()) {
      return res.status(400).json({ ok: false, msg: 'El mensaje no puede estar vacío.' });
    }

    // 1. Mapear historial al formato de Groq (role: system, user, assistant)
    const messages = [
      { role: 'system', content: SYSTEM_PROMPT },
      ...historial.map((h) => ({
        // Cambiar 'model' (formato Gemini) a 'assistant' (formato Groq/OpenAI)
        role: h.role === 'model' ? 'assistant' : h.role, 
        content: h.content 
      })),
      { role: 'user', content: mensaje }
    ];

    // 2. Llamada a Groq
    const chatCompletion = await groq.chat.completions.create({
      messages: messages,
      model: 'llama-3.3-70b-versatile', // Modelo muy capaz para usar Tools
      tools: tools,
      tool_choice: 'auto'
    });

    const responseMessage = chatCompletion.choices[0].message;
    const toolCalls = responseMessage.tool_calls;

    // 3. Verificar si el modelo decidió usar una herramienta
    if (toolCalls && toolCalls.length > 0) {
      // Tomamos la primera herramienta que decidió usar
      const toolCall = toolCalls[0];
      const toolName = toolCall.function.name;
      
      // Groq devuelve los argumentos como un string JSON, hay que parsearlo
      const toolArgs = JSON.parse(toolCall.function.arguments);

      // Ejecutar la herramienta contra la BD
      const respuestaEstructurada = await ejecutarTool(toolName, toolArgs);

      return res.json({
        ok: true,
        ...respuestaEstructurada,
      });
    }

    // 4. Respuesta de texto normal
    return res.json({
      ok: true,
      tipo_respuesta: 'texto',
      mensaje: responseMessage.content,
    });

  } catch (error) {
    console.error('Error en chatbot:', error);
    
    return res.status(500).json({
      ok: false,
      tipo_respuesta: 'texto',
      mensaje: 'Error interno al procesar tu consulta.',
    });
  }
};

module.exports = { enviarMensaje };