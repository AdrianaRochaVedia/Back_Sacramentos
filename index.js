// index.js
require('dotenv').config();
const app = require('./app');
const { dbConnection } = require('./database/config');

const startServer = async () => {
  try {
    await dbConnection(); // Solo se conecta, no sincroniza

    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
      console.log(`Servidor corriendo en puerto ${PORT}`);
    });
  } catch (err) {
    console.error('No se pudo iniciar el servidor:', err);
  }
};

startServer();
