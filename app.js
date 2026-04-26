// app.js
const express = require('express');
const cors = require('cors');
const swaggerUi = require('swagger-ui-express');
const swaggerJsdoc = require('swagger-jsdoc');
const fetch = require('node-fetch');
const helmet = require('helmet');
const passwordRoutes = require('./routes/passwordRoutes');
const audRoutes = require('./routes/auditoriaRoutes');
const errorHandler = require('./middlewares/error-handler');
const app = express();
const dashboardRoutes = require('./routes/dashboardRoutes');

app.set('trust proxy', true);

app.use(cors({
  origin: [
    'http://localhost:5173',
    'https://fronttaller0.vercel.app'
  ],
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'x-token'],
  credentials: true,
}));

app.use(express.static('public'));
app.use(express.json());

const correlation = require('./middlewares/correlation');
const auditar = require('./middlewares/auditar');

app.use(correlation());
app.use(auditar());

// Helmet
app.use(helmet({
  contentSecurityPolicy: {
    useDefaults: true,
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: [
        "'self'",
        "'unsafe-inline'",
        'https://fonts.googleapis.com',
        'https://fonts.gstatic.com'
      ],
      fontSrc: [
        "'self'",
        'https://fonts.gstatic.com'
      ],
      scriptSrc: [
        "'self'",
        "'unsafe-inline'"
      ],
      imgSrc: [
        "'self'",
        'data:',
        'https:'
      ],
      connectSrc: [
        "'self'",
        'http://localhost:3000',
        'http://localhost:5173',
        'https://fronttaller0.vercel.app',
        'https://back-sacramentos.onrender.com',
        'https://*',
        'http://*'
      ],
      objectSrc: ["'none'"],
      baseUri: ["'self'"],
      formAction: ["'self'"],
      frameAncestors: ["'deny'"],
      upgradeInsecureRequests: process.env.NODE_ENV === 'production' ? [] : null,
    },
  },
  hsts: process.env.NODE_ENV === 'production' ? {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  } : false,
  frameguard: {
    action: 'deny'
  },
  noSniff: true,
  hidePoweredBy: true,
  xssFilter: true,
  referrerPolicy: {
    policy: "strict-origin-when-cross-origin"
  },
  crossOriginOpenerPolicy: {
    policy: "same-origin"
  },
  crossOriginResourcePolicy: {
    policy: "same-origin"
  },
  originAgentCluster: true,
  dnsPrefetchControl: {
    allow: false
  },
  ieNoOpen: true,
  permittedCrossDomainPolicies: false
}));

app.disable('x-powered-by');

// Swagger configuration
const swaggerOptions = {
  definition: {
    openapi: '3.0.3',
    info: {
      title: 'Documentación API proyecto Integrador MIGA',
      description: 'API para manejar usuarios, documentos, comentarios y propuestas ciudadanas de MIGA.',
      version: '1.0.0',
      contact: {
        name: 'Soporte API MIGA',
        email: 'soporte@miga.com'
      }
    },
    servers: [
      {
        url: process.env.NODE_ENV === 'production'
          ? 'https://back-sacramentos.onrender.com'
          : 'http://localhost:3000',
        description: process.env.NODE_ENV === 'production' ? 'Servidor de producción' : 'Servidor local'
      },
    ],
    components: {
      securitySchemes: {
        xToken: {
          type: 'apiKey',
          in: 'header',
          name: 'x-token',
          description: 'Token personalizado para autenticación (x-token)',
        },
      },
    },
    security: [{
      xToken: [],
    }],
  },
  apis: ['./routes/*.js', './models/*.js'],
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);
app.use('/api/documentacion', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  explorer: true,
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: "API MIGA - Documentación"
}));

// Routes
app.use('/api/auditoria', audRoutes);
app.use('/api/usuarios', require('./routes/usuarios'));
app.use('/api/personas', require('./routes/personas'));
app.use('/api/parroquias', require('./routes/parroquias'));
app.use('/api/rolsacramentos', require('./routes/rolsacramentos'));
app.use('/api/tiposacramentos', require('./routes/tiposacramentos'));
app.use('/api/sacramentos', require('./routes/sacramentos'));
app.use('/api/matrimoniodetalles', require('./routes/matrimoniodetalles'));
app.use('/api/personasacramentos', require('./routes/personasacramentos'));
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/password', passwordRoutes);
app.use('/api/rol', require('./routes/rolRoute'));
app.use('/api/permiso', require('./routes/permisoRoute'));
app.use('/api/configuracion-seguridad', require('./routes/configuracionSeguridadRoute'));


app.get('/api/proxy-pdf', async (req, res) => {
  try {
    const url = req.query.url;
    const name = req.query.name || 'documento.pdf';

    if (!url) return res.status(400).json({ error: 'Falta la URL del PDF' });

    try {
      new URL(url);
    } catch (error) {
      return res.status(400).json({ error: 'URL inválida' });
    }

    console.log('Intentando obtener PDF desde:', url);

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'MIGA-API-Proxy/1.0'
      },
      timeout: 10000
    });

    if (!response.ok) {
      console.error(`Error al obtener PDF: ${response.status} ${response.statusText}`);
      return res.status(response.status).json({
        error: `No se pudo obtener el PDF externo: ${response.status} ${response.statusText}`
      });
    }

    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/pdf')) {
      console.warn('El contenido no parece ser un PDF:', contentType);
    }

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${name}"`);
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');

    response.body.pipe(res);
  } catch (error) {
    console.error('Error proxy PDF:', error);
    res.status(500).json({
      error: 'Error interno del servidor al obtener el PDF',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

app.use(errorHandler());

module.exports = app;