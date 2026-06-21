const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const { requireAdmin } = require('../middleware/auth');
const adminController = require('../controllers/adminController');

router.use(authMiddleware);
router.use(requireAdmin);

router.get('/users', adminController.listUsers);
router.post('/users', adminController.createUser);
router.patch('/users/:id/approve', adminController.approveUser);
router.patch('/users/:id/reject', adminController.rejectUser);
router.put('/users/:id', adminController.updateExpiry);
router.patch('/users/:id/plan', adminController.updatePlan);
router.delete('/users/:id', adminController.deleteUser);

module.exports = router;
