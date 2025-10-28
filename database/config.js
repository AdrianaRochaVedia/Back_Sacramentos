const { Sequelize } = require('sequelize');
const pg = require('pg'); 
require('dotenv').config();

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT || 5432,
    dialect: 'postgres',
    dialectModule: pg, 
    logging: false,
  }
);

const dbConnection = async () => {
  try {
    await sequelize.authenticate();
    console.log('Conexión a la base de datos exitosa');
  } catch (error) {
    console.error('Error al conectar la base de datos:', error);
    throw new Error('Error al iniciar la base de datos');
  }
};

module.exports = {
  dbConnection,
  sequelize, 
};
