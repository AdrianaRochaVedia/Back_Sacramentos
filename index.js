require('dotenv').config();
const app = require('./app');
const { dbConnection } = require('./database/config');

const startServer = async () => {
  try {
    await dbConnection();

    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
      console.log(`Servidor corriendo en puerto ${PORT}`);
    });
  } catch (err) {
    console.error('No se pudo iniciar el servidor:', err);
  }
};

if (require.main === module) {
  startServer();
}

module.exports = { app, dbConnection };