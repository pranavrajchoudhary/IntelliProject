const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { authorizeRoles } = require('../middleware/authorize');
const adminController = require('../controllers/adminController');

// All admin routes require admin role
router.use(protect);
router.use(authorizeRoles('admin'));

router.get('/users', adminController.getAllUsers);
router.get('/activities', adminController.getUserActivities);
router.get('/stats', adminController.getAdminStats);
router.put('/users/:userId', adminController.updateUser);
router.delete('/users/:userId', adminController.deleteUser);
router.put('/users/:userId/suspend', adminController.suspendUser);

module.exports = router;
