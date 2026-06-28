const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const paymentController = require('../controllers/paymentController');

router.post('/create-preference', auth, paymentController.createPreference);
router.post('/webhook', paymentController.webhook);
router.get('/status', auth, paymentController.status);

module.exports = router;
