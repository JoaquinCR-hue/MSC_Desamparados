const express = require('express');
const router = express.Router();
const { verifyToken, authorize } = require('../middlewares/authMiddleware');

const authRoutes = require('./authRoutes');
const usersRoutes = require('./users');
const reportsRoutes = require('./reports');
const consultsRoutes = require('./consults');
const patrolsRoutes = require('./patrols');
const profileRoutes = require('./profileRoutes');
const policeIARoutes = require('./policeIA.route');

// Rutas públicas
router.use('/auth', authRoutes);

// Rutas protegidas (requieren autenticación)
router.use('/users', verifyToken, usersRoutes);
router.use('/reports', verifyToken, reportsRoutes);
router.use('/consults', verifyToken, consultsRoutes);
router.use('/patrols', verifyToken, authorize(['admin', 'administrador', 'funcionario']), patrolsRoutes);
router.use('/profile', verifyToken, profileRoutes);
router.use('/police-ia', verifyToken, policeIARoutes);

module.exports = router;