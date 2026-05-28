require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });

const app = require('./app');
const { sequelize } = require('./models');
const seedDatabase = require('./seed');

const PORT = process.env.PORT || 3000;

// Función principal que inicia el servidor
const startServer = async () => {
  try {
    // Probar conexión a la base de datos antes de levantar el servidor
    await sequelize.authenticate();
    console.log('✅ Conexion a la base de datos establecida exitosamente.');

    // Sincronizar modelos con la BD y ajustar la estructura si hay columnas nuevas
    await sequelize.sync({ alter: true });
    console.log('✅ Modelos sincronizados con la base de datos.');

    // Sembrar datos iniciales (roles)
    await seedDatabase();

    app.listen(PORT, () => {
      console.log(`🚀 Servidor corriendo en el puerto ${PORT}`);
    });
  } catch (error) {
    console.error('❌ No se pudo iniciar el servidor:', error);
  }
};

startServer();
