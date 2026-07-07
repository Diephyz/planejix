const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const paymentController = require('../controllers/paymentController');

router.post('/create-preference', auth, paymentController.createPreference);
router.post('/subscribe', auth, paymentController.subscribe);
router.post('/webhook', paymentController.webhook);
router.get('/check', paymentController.check);
router.get('/status', auth, paymentController.status);
router.post('/cancel', auth, paymentController.cancel);

module.exports = router;
