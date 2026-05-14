const express = require('express');
const router = express.Router();

const usersRoutes = require('./users');
const reportsRoutes = require('./reports');
const consultsRoutes = require('./consults');
const patrolsRoutes = require('./patrols');

router.use('/users', usersRoutes);
router.use('/reports', reportsRoutes);
router.use('/consults', consultsRoutes);
router.use('/patrols', patrolsRoutes);

module.exports = router;