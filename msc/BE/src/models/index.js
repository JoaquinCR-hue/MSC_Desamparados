const { sequelize } = require('../config/database');
const fs = require('fs');
const path = require('path');
const { DataTypes } = require('sequelize');

// Objeto central que almacena todos los modelos registrados
const db = {};

// Ruta base donde se encuentran los archivos de modelos
const modelsPath = __dirname;

// Lee todos los archivos .js del directorio (excepto este mismo)
// y los registra como modelos de Sequelize
fs.readdirSync(modelsPath)
  .filter((file) => {
    return (
      file.indexOf('.') !== 0 &&
      file !== path.basename(__filename) &&
      file.slice(-3) === '.js'
    );
  })
  .forEach((file) => {
    // Carga el modelo y lo registra usando su nombre como clave
    const model = require(path.join(modelsPath, file))(sequelize, DataTypes);
    db[model.name] = model;
  });

// Ejecuta las asociaciones entre modelos si están definidas
Object.keys(db).forEach((modelName) => {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
});

// Expone la instancia de sequelize para uso externo
db.sequelize = sequelize;

module.exports = db;
