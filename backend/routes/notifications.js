const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const notificationController = require('../controllers/notificationController');

router.use(auth);

router.get('/upcoming', notificationController.getUpcoming);

module.exports = router;
