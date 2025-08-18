const User = require('../models/User');
const Project = require('../models/Project');
const asyncHandler = require('../utils/asyncHandler');

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
