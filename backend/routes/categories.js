const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { validateCategory } = require('../middleware/validate');
const categoryController = require('../controllers/categoryController');

router.use(auth);

router.get('/', categoryController.getAll);
router.post('/', validateCategory, categoryController.create);
router.put('/:id', validateCategory, categoryController.update);
router.delete('/:id', categoryController.remove);

module.exports = router;
