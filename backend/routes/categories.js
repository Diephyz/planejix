const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const categoryController = require('../controllers/categoryController');

router.use(auth);

router.get('/', categoryController.getAll);
router.post('/', categoryController.create);
router.put('/:id', categoryController.update);
router.delete('/:id', categoryController.remove);

module.exports = router;
