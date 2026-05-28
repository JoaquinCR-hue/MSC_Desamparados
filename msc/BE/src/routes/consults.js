const express = require('express');
const router = express.Router();
const consultController = require('../controllers/consultController');

router.get('/getAllConsults', consultController.getAll);
router.post('/createConsult', consultController.create);
router.put('/updateConsult/:id', consultController.update);

module.exports = router;