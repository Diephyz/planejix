const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { validateTransaction } = require('../middleware/validate');
const transactionController = require('../controllers/transactionController');

router.use(auth);

router.get('/summary', transactionController.getSummary);
router.get('/accumulated', transactionController.getAccumulatedBalance);
router.get('/by-category', transactionController.getByCategory);
router.get('/', transactionController.getAll);
router.post('/', validateTransaction, transactionController.create);
router.put('/:id', validateTransaction, transactionController.update);
router.delete('/:id', transactionController.remove);

module.exports = router;
