const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const userController = require('../controllers/userController');

router.get('/profile', protect, userController.getUserProfile);
router.put('/profile', protect, userController.updateProfile);
router.get('/', protect, userController.getUsers);
router.get('/search', protect, userController.searchUsers);
router.get('/:id', protect, userController.getUserById);

module.exports = router;
