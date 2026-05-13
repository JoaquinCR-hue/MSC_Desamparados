const { Sequelize } = require('sequelize');
require('dotenv').config();

// Instancia de Sequelize con configuración desde variables de entorno
const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    dialect: process.env.DB_DIALECT || 'mysql',
    logging: false, // Cambiar a console.log para ver las consultas SQL en desarrollo
    define: {
      timestamps: true,
      underscored: true,
    },
  }
);

// Función que verifica la conexión a la base de datos
const testConnection = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connection established successfully.');
  } catch (error) {
    console.error('❌ Unable to connect to the database:', error);
  }
};

module.exports = {
  sequelize,
  testConnection,
};
