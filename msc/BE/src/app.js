const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
require('dotenv').config();

const app = express();

// Middlewares globales de seguridad y parseo
app.use(helmet());
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Ruta raíz de verificación de la API
app.get('/', (req, res) => {
  res.json({ message: 'Welcome to the MSC Desamparados API' });
});

// Manejo de rutas no encontradas (404)
app.use((req, res, next) => {
  res.status(404).json({ message: 'Route not found' });
});

// Manejo de errores global del servidor
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.message : {},
  });
});

module.exports = app;
