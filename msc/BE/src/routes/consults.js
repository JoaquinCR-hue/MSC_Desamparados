const express = require('express');
const router = express.Router();
const consultController = require('../controllers/consultController');

router.get('/', consultController.getAll);
router.post('/', consultController.create);
router.put('/:id', consultController.update);

module.exports = router;