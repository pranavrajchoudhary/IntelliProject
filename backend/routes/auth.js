const express = require('express');
const router = express.Router();
const { registerUser, authUser, getMe, updateProfile, changePassword, forgotPasswordSendOTP, forgotPasswordResetPassword } = require('../controllers/authController');
const { protect } = require('../middleware/auth');

router.post('/register', registerUser);
router.post('/login', authUser);
router.get('/me', protect, getMe);
router.put('/profile', protect, updateProfile);
router.put('/change-password', protect, changePassword);

// Forgot password routes (public - no authentication required)
router.post('/forgot-password/send-otp', forgotPasswordSendOTP);
router.post('/forgot-password/verify-otp', forgotPasswordResetPassword);

module.exports = router;
