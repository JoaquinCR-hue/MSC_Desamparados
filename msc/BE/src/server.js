const app = require('./app');
const { testConnection, sequelize } = require('./config/database');

const PORT = process.env.PORT || 3000;

// Función principal que inicia el servidor
const startServer = async () => {
  try {
    // Probar conexión a la base de datos antes de levantar el servidor
    await testConnection();

    // Sincronizar modelos con la BD (crea tablas si no existen)
    // En producción se recomienda usar migraciones en lugar de sync
    // await sequelize.sync({ force: false });

    app.listen(PORT, () => {
      console.log(`🚀 Server running at http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
  }
};

startServer();
