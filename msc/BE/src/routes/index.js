const express = require('express');
const router = express.Router();
const { verifyToken, authorize } = require('../middlewares/authMiddleware');

const authRoutes = require('./authRoutes');
const usersRoutes = require('./users');
const reportsRoutes = require('./reports');
const consultsRoutes = require('./consults');
const patrolsRoutes = require('./patrols');

// Rutas públicas
router.use('/auth', authRoutes);

// Rutas protegidas (requieren autenticación)
router.use('/users', verifyToken, authorize('administrador'), usersRoutes);
router.use('/reports', verifyToken, reportsRoutes);
router.use('/consults', verifyToken, consultsRoutes);
router.use('/patrols', verifyToken, authorize(['administrador', 'funcionario']), patrolsRoutes);

module.exports = router;