const express = require('express');
const router = express.Router();
const patrolController = require('../controllers/patrolController');

router.get('/', patrolController.getAll);
router.post('/', patrolController.create);
router.put('/:id', patrolController.update);
router.delete('/:id', patrolController.delete);

module.exports = router;