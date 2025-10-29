// app.js
const express = require('express');
const cors = require('cors');
const swaggerUi = require('swagger-ui-express');
const swaggerJsdoc = require('swagger-jsdoc');
const fetch = require('node-fetch');
const helmet = require('helmet');

const app = express();

app.use(cors());
app.use(express.static('public'));
app.use(express.json());

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
        "'unsafe-inline'" // Solo para Swagger, considera quitarlo en producción
      ],
      imgSrc: [
        "'self'", 
        'data:', 
        'https:'
      ],
      connectSrc: [
        "'self'", 
        'http://localhost:3000',
        'http://localhost:5173', // Permite conexiones locales para desarrollo
        'https://api.tu-dominio.com', // Reemplaza con tu API real
        'https://*', // Permite conexiones HTTPS externas para el proxy
        'http://*'   // Permite conexiones HTTP externas para el proxy (opcional, solo si necesitas HTTP)
      ],
      objectSrc: ["'none'"],
      baseUri: ["'self'"],
      formAction: ["'self'"],
      frameAncestors: ["'deny'"], // Más restrictivo que 'self'
      upgradeInsecureRequests: process.env.NODE_ENV === 'production' ? [] : null,
    },
  },
  
  // HSTS - HTTP Strict Transport Security
  hsts: process.env.NODE_ENV === 'production' ? {
    maxAge: 31536000, // 1 año
    includeSubDomains: true,
    preload: true
  } : false,
  
  // X-Frame-Options - Previene clickjacking
  frameguard: { 
    action: 'deny'
  },
  
  // X-Content-Type-Options - Previene MIME sniffing
  noSniff: true,
  
  // Ocultar X-Powered-By
  hidePoweredBy: true,
  
  // X-XSS-Protection
  xssFilter: true,
  
  // Referrer Policy
  referrerPolicy: { 
    policy: "strict-origin-when-cross-origin" 
  },
  
  // Cross-Origin Policies
  crossOriginOpenerPolicy: { 
    policy: "same-origin" 
  },
  
  crossOriginResourcePolicy: { 
    policy: "same-origin" 
  },
  
  // Origin Agent Cluster
  originAgentCluster: true,
  
  // X-DNS-Prefetch-Control
  dnsPrefetchControl: { 
    allow: false 
  },
  
  // X-Download-Options
  ieNoOpen: true,
  
  // X-Permitted-Cross-Domain-Policies
  permittedCrossDomainPolicies: false
}));

//X-Powered-By no se muestre
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
        email: 'soporte@miga.com' // email-real
      }
    },
    servers: [
      { 
        url: process.env.NODE_ENV === 'production' 
          ? 'https://api.tu-dominio.com' 
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
app.use('/api/usuarios', require('./routes/usuarios'));
app.use('/api/personas', require('./routes/personas'));
app.use('/api/parroquias', require('./routes/parroquias'));
app.use('/api/rolsacramentos', require('./routes/rolsacramentos'));
app.use('/api/tiposacramentos', require('./routes/tiposacramentos'));
app.use('/api/sacramentos', require('./routes/sacramentos'));

app.get('/api/proxy-pdf', async (req, res) => {
  try {
    const url = req.query.url;
    const name = req.query.name || 'documento.pdf';

    if (!url) return res.status(400).json({ error: 'Falta la URL del PDF' });

    // Validar que la URL sea válida
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
      timeout: 10000 // 10 segundos timeout
    });

    if (!response.ok) {
      console.error(`Error al obtener PDF: ${response.status} ${response.statusText}`);
      return res.status(response.status).json({ 
        error: `No se pudo obtener el PDF externo: ${response.status} ${response.statusText}` 
      });
    }

    // Verificar que el contenido sea un PDF
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

module.exports = app;
