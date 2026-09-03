require('dotenv').config();
const { sequelize } = require('../database/config');

async function run() {
  try {
    await sequelize.authenticate();

    await sequelize.transaction(async (t) => {
      // Eliminar constraint única global
      await sequelize.query(
        `ALTER TABLE usuario DROP CONSTRAINT IF EXISTS "usuario_nombre_usuario_key";`,
        { transaction: t }
      );

      // Eliminar índice si existía con otro nombre
      await sequelize.query(
        `DROP INDEX IF EXISTS "usuario_nombre_usuario_key";`,
        { transaction: t }
      );

      // Crear índice único parcial: solo entre usuarios activos
      await sequelize.query(
        `CREATE UNIQUE INDEX IF NOT EXISTS "usuario_nombre_usuario_activo_key"
         ON usuario(nombre_usuario)
         WHERE activo = true;`,
        { transaction: t }
      );
    });

    console.log('Migración completada: índice único parcial creado en nombre_usuario (activo = true).');
  } catch (err) {
    console.error('Error en migración:', err.message);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

run();
