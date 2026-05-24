const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const transactionController = require('../controllers/transactionController');

router.use(auth);

router.get('/summary', transactionController.getSummary);
router.get('/by-category', transactionController.getByCategory);
router.get('/', transactionController.getAll);
router.post('/', transactionController.create);
router.put('/:id', transactionController.update);
router.delete('/:id', transactionController.remove);

module.exports = router;
