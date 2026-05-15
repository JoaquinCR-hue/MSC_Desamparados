const app = require('./app');
const { sequelize } = require('./models');

const PORT = process.env.PORT || 3000;

// Función principal que inicia el servidor
const startServer = async () => {
  try {
    // Probar conexión a la base de datos antes de levantar el servidor
    await sequelize.authenticate();
    console.log('✅ Conexion a la base de datos establecida exitosamente.');

    // Sincronizar modelos con la BD (crea tablas si no existen)
    // En producción se recomienda usar migraciones en lugar de sync
    // await sequelize.sync({ force: false });

    app.listen(PORT, () => {
      console.log(`🚀 Servidor corriendo en el puerto ${PORT}`);
    });
  } catch (error) {
    console.error('❌ No se pudo iniciar el servidor:', error);
  }
};

startServer();
