const fs = require('fs');

const {
  PutObjectCommand
} = require('@aws-sdk/client-s3');

const {
  AnalyzeDocumentCommand
} = require('@aws-sdk/client-textract');

const {
  s3,
  textract
} = require('../config/aws');

const extraerDatosSacramento = (texto) => {
  const lineas = texto
    .split('\n')
    .map(l => l.trim())
    .filter(Boolean);

  const datos = {
    fecha_sacramento: null,
    foja: null,
    numero: null,
    nombre: null,
    parroquia: null
  };

  const textoPlano = lineas.join(' ');

  const fechaMatch = textoPlano.match(/FECHA DE BAUTISMO:\s*(\d{1,2}\/\d{1,2}\/\d{4})/i);
  if (fechaMatch) datos.fecha_sacramento = fechaMatch[1];

  const fojaMatch = textoPlano.match(/FOJA:\s*([A-Za-z0-9]+)/i);
  if (fojaMatch) datos.foja = fojaMatch[1];

  const numeroMatch = textoPlano.match(/NUMERO:\s*(\d+)/i);
  if (numeroMatch) datos.numero = numeroMatch[1];

  const nombreMatch = textoPlano.match(/NOMBRE DEL BAUTIZADO:\s*(.*?)\s*FECHA DE BAUTISMO:/i);
  if (nombreMatch) datos.nombre = nombreMatch[1].trim();

  const parroquiaMatch = textoPlano.match(/PARROQUIA\s+(.+?)\s+Diocesis/i);
  if (parroquiaMatch) datos.parroquia = parroquiaMatch[1].trim();

  return datos;
};

const procesarOCR = async (req, res) => {
  try {

    if (!req.file) {
      return res.status(400).json({
        ok: false,
        msg: 'Debe subir una imagen'
      });
    }

    const fileContent = fs.readFileSync(req.file.path);
    const key = `sacramentos/${Date.now()}-${req.file.originalname}`;

    // para subir a S3
    await s3.send(
      new PutObjectCommand({
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: key,
        Body: fileContent,
        ContentType: req.file.mimetype
      })
    );

    // para el OCR Textract
    const response = await textract.send(
      new AnalyzeDocumentCommand({
        Document: {
          S3Object: {
            Bucket: process.env.AWS_BUCKET_NAME,
            Name: key
          }
        },
        FeatureTypes: ['FORMS', 'TABLES']
      })
    );

    // para extraer texto
    const texto = response.Blocks
      .filter(block => block.BlockType === 'LINE')
      .map(block => block.Text)
      .join('\n');
    
      const datosDetectados = extraerDatosSacramento(texto);
    fs.unlinkSync(req.file.path);

    return res.json({
    ok: true,
    texto,
    datosDetectados,
    blocks: response.Blocks
    });

  } catch (error) {
    console.log(error);

    return res.status(500).json({
      ok: false,
      msg: 'Error OCR',
      error: error.message
    });
  }
};

module.exports = {
  procesarOCR
};