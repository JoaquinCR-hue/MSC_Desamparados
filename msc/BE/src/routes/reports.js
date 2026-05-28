const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const multer = require('multer');

const upload = multer({ storage: multer.memoryStorage() });

router.get('/', reportController.getAll);
router.post('/', reportController.create);
router.post('/upload', upload.single('image'), reportController.uploadImage);
router.put('/:id', reportController.update);
router.delete('/:id', reportController.delete);

module.exports = router;