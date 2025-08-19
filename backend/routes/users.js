const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { authorizeRoles } = require('../middleware/authorize');
const userController = require('../controllers/userController');

router.get('/profile', protect, userController.getUserProfile);
router.put('/profile', protect, userController.updateProfile);

// Get users - Admins and PMs can view
router.get('/', protect, authorizeRoles('admin', 'pm'), userController.getUsersWithRoles);

router.get('/search', protect, userController.searchUsers);
router.get('/:id', protect, userController.getUserById);

// Update user role - Only admins
router.put('/:userId/role', protect, authorizeRoles('admin'), userController.updateUserRole);

module.exports = router;
