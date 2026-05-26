const express = require('express');
const router = express.Router();
const patrolController = require('../controllers/patrolController');

router.get('/getAllPatrols', patrolController.getAll);
router.post('/createPatrol', patrolController.create);
router.put('/updatePatrol/:id', patrolController.update);
router.delete('/deletePatrol/:id', patrolController.delete);

module.exports = router;