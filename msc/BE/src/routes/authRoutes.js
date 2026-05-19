const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { verifyToken } = require('../middlewares/authMiddleware');

router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/logout', verifyToken, authController.logout);
router.post('/recover-password', authController.recoverPassword);

// Ruta para verificar si el usuario sigue "en línea" (token válido)
router.get('/check-status', verifyToken, (req, res) => {
  res.json({ message: 'Usuario en línea', user: req.user });
});

module.exports = router;
