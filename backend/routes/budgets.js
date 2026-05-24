const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const budgetController = require('../controllers/budgetController');

router.use(auth);

router.get('/progress', budgetController.getProgress);
router.get('/', budgetController.getAll);
router.post('/', budgetController.create);
router.put('/:id', budgetController.update);
router.delete('/:id', budgetController.remove);

module.exports = router;
