const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const savingsController = require('../controllers/savingsController');

router.use(auth);

router.get('/', savingsController.getAll);
router.post('/', savingsController.create);
router.put('/:id', savingsController.update);
router.patch('/:id/deposit', savingsController.deposit);
router.delete('/:id', savingsController.remove);

module.exports = router;
