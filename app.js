// app.js
'use strict';

const express    = require('express');
const cors       = require('cors');
const helmet     = require('helmet');
const fetch      = require('node-fetch');
const swaggerUi  = require('swagger-ui-express');
const swaggerJsdoc = require('swagger-jsdoc');

// ── Middlewares propios ───────────────────────────────────────────
const correlation       = require('./middlewares/correlation');
const auditarAplicacion = require('./middlewares/auditarAplicacion');
const errorHandler      = require('./middlewares/error-handler');

// ── Modelos y relaciones ──────────────────────────────────────────
require('./models/associations');

// ─────────────────────────────────────────────────────────────────
const app = express();
const dashboardRoutes = require('./routes/dashboardRoutes');
const dominioPermitidoRoute = require('./routes/dominioPermitidoRoute');
const usuarioParroquiaRoute = require('./routes/usuarioParroquia');
const ocrRoutes = require('./routes/ocrRoute');

app.set('trust proxy', true);
app.disable('x-powered-by');

// ── CORS ──────────────────────────────────────────────────────────
const ALLOWED_ORIGINS = [
  'http://localhost:5173',
  'https://fronttaller0.vercel.app',
  'http://sacra360.s3-website-us-east-1.amazonaws.com',
];

app.use(cors({
  origin:         ALLOWED_ORIGINS,
  methods:        ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'x-token'],
  credentials:    true,
}));

// ── Helmet ────────────────────────────────────────────────────────
const IS_PROD = process.env.NODE_ENV === 'production';

app.use(helmet({
  contentSecurityPolicy: {
    useDefaults: true,
    directives: {
      defaultSrc:   ["'self'"],
      styleSrc:     ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com', 'https://fonts.gstatic.com'],
      fontSrc:      ["'self'", 'https://fonts.gstatic.com'],
      scriptSrc:    ["'self'", "'unsafe-inline'"],
      imgSrc:       ["'self'", 'data:', 'https:'],
      connectSrc:   ["'self'", ...ALLOWED_ORIGINS, 'https://back-sacramentos.onrender.com', 'https://*', 'http://*'],
      objectSrc:    ["'none'"],
      baseUri:      ["'self'"],
      formAction:   ["'self'"],
      frameAncestors: ["'deny'"],
      upgradeInsecureRequests: IS_PROD ? [] : null,
    },
  },
  hsts:                      IS_PROD ? { maxAge: 31536000, includeSubDomains: true, preload: true } : false,
  frameguard:                { action: 'deny' },
  noSniff:                   true,
  hidePoweredBy:             true,
  xssFilter:                 true,
  referrerPolicy:            { policy: 'strict-origin-when-cross-origin' },
  crossOriginOpenerPolicy:   { policy: 'same-origin' },
  crossOriginResourcePolicy: { policy: 'same-origin' },
  originAgentCluster:        true,
  dnsPrefetchControl:        { allow: false },
  ieNoOpen:                  true,
  permittedCrossDomainPolicies: false,
}));

// ── Body / static ─────────────────────────────────────────────────
app.use(express.static('public'));
app.use(express.json());

// ── Middlewares globales ──────────────────────────────────────────
app.use(correlation());
app.use(auditarAplicacion());

// ── Swagger ───────────────────────────────────────────────────────
const swaggerSpec = swaggerJsdoc({
  definition: {
    openapi: '3.0.3',
    info: {
      title:       'Documentación API proyecto Integrador MIGA',
      description: 'API para manejar usuarios, documentos, comentarios y propuestas ciudadanas de MIGA.',
      version:     '1.0.0',
      contact:     { name: 'Soporte API MIGA', email: 'soporte@miga.com' },
    },
    servers: [{
      url:         IS_PROD ? 'https://back-sacramentos.onrender.com' : 'http://localhost:3000',
      description: IS_PROD ? 'Servidor de producción' : 'Servidor local',
    }],
    components: {
      securitySchemes: {
        xToken: { type: 'apiKey', in: 'header', name: 'x-token', description: 'Token de autenticación' },
      },
    },
    security: [{ xToken: [] }],
  },
  apis: ['./routes/*.js', './models/*.js'],
});

app.use('/api/documentacion', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  explorer:        true,
  customCss:       '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'API MIGA - Documentación',
}));

// ── Rutas ─────────────────────────────────────────────────────────
app.use('/api/auditoria',               require('./routes/auditoriasRoutes'));
app.use('/api/usuarios',                require('./routes/usuarios'));
app.use('/api/personas',                require('./routes/personas'));
app.use('/api/parroquias',              require('./routes/parroquias'));
app.use('/api/rolsacramentos',          require('./routes/rolsacramentos'));
app.use('/api/tiposacramentos',         require('./routes/tiposacramentos'));
app.use('/api/sacramentos',             require('./routes/sacramentos'));
app.use('/api/matrimoniodetalles',      require('./routes/matrimoniodetalles'));
app.use('/api/personasacramentos',      require('./routes/personasacramentos'));
app.use('/api/dashboard',               require('./routes/dashboardRoutes'));
app.use('/api/password',                require('./routes/passwordRoutes'));
app.use('/api/rol',                     require('./routes/rolRoute'));
app.use('/api/permiso',                 require('./routes/permisoRoute'));
app.use('/api/modulo',                  require('./routes/moduloRoute'));
app.use('/api/configuracion-seguridad', require('./routes/configuracionSeguridadRoute'));
app.use('/api/ocr', require('./routes/sacramentoOcr'));
app.use('/api/dominio-permitido',       require('./routes/dominioPermitidoRoute'));
app.use('/api/usuario-parroquia',       require('./routes/usuarioParroquia'));
app.use('/api/riesgos', require('./routes/riesgos'));

app.get('/api/proxy-pdf', async (req, res) => {
  const { url, name = 'documento.pdf' } = req.query;

  if (!url) return res.status(400).json({ error: 'Falta la URL del PDF' });

  try { new URL(url); }
  catch { return res.status(400).json({ error: 'URL inválida' }); }

  try {
    const response = await fetch(url, {
      headers: { 'User-Agent': 'MIGA-API-Proxy/1.0' },
      timeout: 10_000,
    });

    if (!response.ok) {
      return res.status(response.status).json({
        error: `No se pudo obtener el PDF externo: ${response.status} ${response.statusText}`,
      });
    }

    res.setHeader('Content-Type',        'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${name}"`);
    res.setHeader('Cache-Control',       'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma',              'no-cache');
    res.setHeader('Expires',             '0');
    response.body.pipe(res);

  } catch (error) {
    console.error('Error proxy PDF:', error);
    res.status(500).json({
      error:   'Error interno al obtener el PDF',
      details: !IS_PROD ? error.message : undefined,
    });
  }
});

// ── Error handler (siempre al final) ─────────────────────────────
app.use(errorHandler());

module.exports = app;