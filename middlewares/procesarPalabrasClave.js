const natural = require('natural');
const { es } = require('stopwords-iso');
const tokenizer = new natural.WordTokenizer();
const stemmer = natural.PorterStemmerEs;

function procesarTexto(texto) {
  if (!texto || typeof texto !== 'string') return [];

  // Tokenizar
  let palabras = tokenizer.tokenize(texto.toLowerCase());

  // Eliminar stopwords
  palabras = palabras.filter(palabra => !es.includes(palabra));

  // Aplicar stemming
  palabras = palabras.map(palabra => stemmer.stem(palabra));

  // Filtrar palabras vacías, cortas o no deseadas
  palabras = palabras.filter(palabra => palabra.length > 2);

  // Eliminar duplicados
  return [...new Set(palabras)];
}

const procesarPalabrasClave = async (documento, options) => {
  try {
    const campos = [
      documento.nombre,
      documento.descripcion,
      documento.concepto_basico,
      documento.aplicacion,
      documento.tipo,
      documento.fuente_origen,
      documento.importancia,
      documento.jerarquia,
      documento.cpe
    ].filter(campo => campo && typeof campo === 'string');

    const textoCombinado = campos.join(' ');

    const palabrasClave = procesarTexto(textoCombinado);

    documento.palabras_clave_procesadas = palabrasClave.join(' ');

  } catch (error) {
    console.error('Error en el middleware de palabras clave:', error);
    throw error;
  }
};

module.exports = (Documento) => {
  Documento.addHook('beforeCreate', procesarPalabrasClave);
  Documento.addHook('beforeUpdate', procesarPalabrasClave);
};