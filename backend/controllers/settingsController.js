const User = require('../models/User');
const Project = require('../models/Project');
const asyncHandler = require('../utils/asyncHandler');
const { sendOTPEmail, testBrevoConnection } = require('../config/brevo');
const { generateOTP, storeOTP, verifyOTP } = require('../utils/otpService');

exports.getUserSettings = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select('-password');
  const projectCount = await Project.countDocuments({ members: req.user._id });
  
  res.json({
    user,
    stats: {
      projectCount,
      memberSince: user.createdAt
    }
  });
});

exports.updateUserSettings = asyncHandler(async (req, res) => {
  const { name, email, preferences } = req.body;
  
  const user = await User.findByIdAndUpdate(
    req.user._id,
    { name, email, preferences },
    { new: true }
  ).select('-password');
  
  res.json(user);
});

exports.changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  
  const user = await User.findById(req.user._id);
  
  if (!await user.matchPassword(currentPassword)) {
    return res.status(400).json({ message: 'Current password is incorrect' });
  }
  
  user.password = newPassword;
  await user.save();
  
  res.json({ message: 'Password updated successfully' });
});

exports.deleteAccount = asyncHandler(async (req, res) => {
  await User.findByIdAndDelete(req.user._id);
  res.json({ message: 'Account deleted successfully' });
});

exports.sendPasswordResetOTP = asyncHandler(async (req, res) => {
  const { email } = req.body;
  
  if (email !== req.user.email) {
    return res.status(400).json({ message: 'Email does not match your account' });
  }
  
  const user = await User.findById(req.user._id);
  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }
  
  try {
    const otp = generateOTP();
    storeOTP(email, otp);
    
    await sendOTPEmail(email, otp, user.name);
    
    res.json({ 
      message: 'OTP sent successfully to your email',
      email: email 
    });
  } catch (error) {
    console.error('Error sending OTP:', error);
    res.status(500).json({ message: 'Failed to send OTP. Please try again.' });
  }
});

exports.verifyOTPAndResetPassword = asyncHandler(async (req, res) => {
  const { email, otp, newPassword } = req.body;
  
  if (email !== req.user.email) {
    return res.status(400).json({ message: 'Email does not match your account' });
  }
  
  const otpVerification = verifyOTP(email, otp);
  
  if (!otpVerification.valid) {
    return res.status(400).json({ message: otpVerification.message });
  }
  
  const user = await User.findById(req.user._id);
  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }
  
  user.password = newPassword;
  await user.save();
  
  res.json({ message: 'Password reset successfully' });
});

exports.testBrevo = asyncHandler(async (req, res) => {
  try {
    const result = await testBrevoConnection();
    res.json(result);
  } catch (error) {
    res.status(500).json({ message: 'Failed to test BREVO connection', error: error.message });
  }
});
