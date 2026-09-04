// Extrae los campos de un acta a partir del texto plano que ya devolvió
// Textract, usando un LLM (Groq) en vez de regex — así se tolera texto con
// errores de OCR, formularios llenados a mano y variaciones de redacción que
// una regex fija no puede cubrir. Si no hay GROQ_API_KEY o la llamada falla,
// se devuelve null para que quien llama use el parser de regex de respaldo.
const Groq = require('groq-sdk');

const groq = process.env.GROQ_API_KEY ? new Groq({ apiKey: process.env.GROQ_API_KEY }) : null;

const tipoSacramentoMap = { 1: 'bautismo', 2: 'matrimonio', 3: 'primeracomunion', 4: 'confirmacion' };

const ESQUEMAS = {
  bautismo: {
    campos: ['fecha_sacramento', 'foja', 'numero', 'nombre', 'parroquia', 'fecha_nacimiento', 'lugar_nacimiento', 'nombre_padre', 'nombre_madre'],
    descripcion: `Es un acta de bautismo. Extrae:
- fecha_sacramento: fecha en que se administró el bautismo, formato dd/mm/aaaa.
- foja: número de foja del libro.
- numero: número de acta.
- nombre: nombre completo del bautizado (nombre(s) + apellidos).
- parroquia: nombre de la parroquia, SIN la palabra "Parroquia" delante y sin dirección ni teléfono (ej. "San Sebastián", no "Parroquia San Sebastián").
- fecha_nacimiento: fecha de nacimiento del bautizado, formato dd/mm/aaaa.
- lugar_nacimiento: ciudad/lugar donde nació.
- nombre_padre: nombre completo del padre.
- nombre_madre: nombre completo de la madre.

Pista para detectar y corregir errores de OCR: en Bolivia el primer apellido del bautizado normalmente es igual al primer apellido del padre, y el segundo apellido es igual al primer apellido de la madre. Si el nombre del bautizado no calza con esa regla pero se parece visualmente (letras que el OCR pudo confundir) a los apellidos de los padres, es una señal fuerte de error de OCR — úsala para marcar el campo "nombre" como dudoso y proponer la corrección basada en el apellido real del padre/madre, no en una palabra que "suene parecida" sin relación con ellos.`
  },
  confirmacion: {
    campos: ['fecha_sacramento', 'foja', 'numero', 'nombre', 'parroquia'],
    descripcion: `Es un acta de confirmación. Extrae:
- fecha_sacramento: fecha en que se administró la confirmación, formato dd/mm/aaaa.
- foja: número de foja del libro. numero: número de acta.
- nombre: nombre completo del confirmado.
- parroquia: nombre de la parroquia, SIN la palabra "Parroquia" delante y sin dirección ni teléfono (ej. "San Sebastián", no "Parroquia San Sebastián").`
  },
  primeracomunion: {
    campos: ['fecha_sacramento', 'foja', 'numero', 'nombre', 'parroquia'],
    descripcion: `Es un acta de primera comunión. Extrae:
- fecha_sacramento: fecha de la primera comunión, formato dd/mm/aaaa.
- foja: número de foja del libro. numero: número de acta.
- nombre: nombre completo del comulgado.
- parroquia: nombre de la parroquia, SIN la palabra "Parroquia" delante y sin dirección ni teléfono (ej. "San Sebastián", no "Parroquia San Sebastián").`
  },
  matrimonio: {
    campos: ['fecha_sacramento', 'foja', 'numero', 'parroquia', 'nombre_contrayente', 'nombre_contrayenta', 'lugar_ceremonia', 'reg_civil', 'numero_acta', 'testigo1', 'testigo2'],
    descripcion: `Es un acta de matrimonio. Extrae:
- fecha_sacramento: fecha de la ceremonia, formato dd/mm/aaaa.
- foja: número de foja del libro parroquial. numero: número de acta parroquial.
- parroquia: nombre de la parroquia, SIN la palabra "Parroquia" delante y sin dirección ni teléfono (ej. "San Sebastián", no "Parroquia San Sebastián").
- nombre_contrayente: nombre completo del contrayente (hombre).
- nombre_contrayenta: nombre completo de la contrayenta (mujer).
- lugar_ceremonia: ciudad donde se celebró la ceremonia.
- reg_civil: número de registro civil con el que quedó inscrito el matrimonio.
- numero_acta: número de acta del registro civil (no el número de acta parroquial).
- testigo1, testigo2: nombres completos de los dos testigos.`
  }
};

const construirConfianza = (datos) =>
  Object.fromEntries(
    Object.entries(datos).map(([campo, valor]) => [campo, valor !== null && valor !== ''])
  );

const extraerConGroq = async (texto, tipoSacramentoId) => {
  if (!groq) return null;

  const clave = tipoSacramentoMap[tipoSacramentoId];
  const esquema = ESQUEMAS[clave];
  if (!esquema) return null;

  const prompt = `Eres un asistente que extrae datos estructurados de actas parroquiales bolivianas cuyo texto viene de un OCR (AWS Textract). El texto puede traer errores de reconocimiento (letras cambiadas, palabras unidas, líneas en un orden distinto al del documento original) y puede ser un formulario llenado a mano y fotografiado, así que interpreta el contenido aunque la redacción exacta varíe.

${esquema.descripcion}

Además de extraer, revisa tu propia extracción: para cada campo que hayas podido rellenar pero cuyo texto de origen te parezca sospechoso de tener un error de OCR (una letra que no encaja en el nombre, algo que quedó a medias, un valor poco común o inconsistente con el resto del documento), señálalo como dudoso y, si tienes una corrección razonablemente segura, propónla — nunca inventes una corrección si no estás realmente seguro, en ese caso deja sugerencia en null.

Reglas:
- Responde SOLO un objeto JSON con esta forma exacta: {"datos": {...}, "revision": {...}}.
- "datos" debe tener exactamente estas claves: ${esquema.campos.join(', ')}. Si un dato no aparece en el texto o no estás seguro, pon null en esa clave — nunca inventes datos.
- "revision" solo debe incluir las claves de los campos que consideres dudosos (omite los que están bien). Cada entrada va así: {"dudoso": true, "sugerencia": "valor corregido o null", "motivo": "razón breve, menos de 8 palabras"}.
- Las fechas van en formato dd/mm/aaaa (día y mes con 2 dígitos).
- Los nombres de personas van con mayúscula inicial normal (no todo en mayúsculas), sin las etiquetas del formulario ("Nombre del bautizado:", etc.) ni comas de más.

Texto extraído del documento:
"""
${texto}
"""`;

  try {
    const completion = await groq.chat.completions.create({
      model: 'openai/gpt-oss-120b',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
      temperature: 0
    });

    const bruto = JSON.parse(completion.choices[0].message.content);
    const datosBrutos = bruto.datos || bruto;

    // Campos como foja/numero a veces vuelven como number en el JSON (33 en
    // vez de "33") aunque se pida string en el prompt — se normalizan igual.
    const datos = {};
    for (const campo of esquema.campos) {
      const valor = datosBrutos[campo];
      if (valor === null || valor === undefined) { datos[campo] = null; continue; }
      const texto = String(valor).trim();
      datos[campo] = texto || null;
    }

    // Solo se conservan sugerencias sobre campos reales del esquema y que
    // digan algo distinto al valor ya extraído (si no, no aportan nada).
    const revisionBruta = (bruto.revision && typeof bruto.revision === 'object') ? bruto.revision : {};
    const revision = {};
    for (const campo of esquema.campos) {
      const entrada = revisionBruta[campo];
      if (!entrada?.dudoso) continue;
      const sugerencia = typeof entrada.sugerencia === 'string' ? entrada.sugerencia.trim() : null;
      revision[campo] = {
        dudoso: true,
        sugerencia: sugerencia && sugerencia !== datos[campo] ? sugerencia : null,
        motivo: typeof entrada.motivo === 'string' ? entrada.motivo.trim() : null
      };
    }

    datos._confianza = construirConfianza(datos);
    datos._revision = revision;
    return datos;
  } catch (error) {
    console.error('Groq no pudo extraer los datos del OCR, se usa el parser de respaldo:', error.message);
    return null;
  }
};

module.exports = { extraerConGroq };
