const express = require('express');
const router = express.Router();
const profileController = require('../controllers/profileController');
const multer = require('multer');

const upload = multer({ storage: multer.memoryStorage() });

router.get('/', profileController.getProfile);
router.put('/', profileController.updateProfile);
router.put('/photo', profileController.updateProfilePhoto);

// Subir foto al backend y a Cloudinary
router.post('/photo/upload', upload.single('avatar'), profileController.uploadProfilePhoto);

// Cambiar contraseña
router.put('/password', profileController.changePassword);

module.exports = router;
