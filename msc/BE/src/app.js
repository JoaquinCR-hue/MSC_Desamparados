const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
require('dotenv').config();

const app = express();
const apiRoutes = require('./routes');

// Middlewares globales de seguridad y parseo
app.use(helmet());
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Ruta raíz de verificación de la API
app.get('/', (req, res) => {
  res.json({ message: 'Bienvenido a la API de MSC Desamparados' });
});

// Rutas de la API V1
app.use('/api/v1', apiRoutes);

// Manejo de rutas no encontradas (404)
app.use((req, res, next) => {
  res.status(404).json({ message: 'Ruta no encontrada' });
});

// Manejo de errores global del servidor
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    message: 'Error interno del servidor',
    error: process.env.NODE_ENV === 'development' ? err.message : {},
  });
});

module.exports = app;
