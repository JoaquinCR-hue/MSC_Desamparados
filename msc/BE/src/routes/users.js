const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { authorize } = require('../middlewares/authMiddleware');

router.get('/', authorize(['admin', 'administrador', 'funcionario']), userController.getAll);
router.post('/', authorize(['admin', 'administrador']), userController.create);
router.put('/:id', authorize(['admin', 'administrador']), userController.update);
router.delete('/:id', authorize(['admin', 'administrador']), userController.delete);

module.exports = router;