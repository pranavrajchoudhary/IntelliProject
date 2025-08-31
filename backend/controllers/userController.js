const User = require('../models/User');
const asyncHandler = require('../utils/asyncHandler');
const mongoose = require('mongoose');

exports.getUserProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select('-password');
  res.json(user);
});

exports.updateProfile = asyncHandler(async (req, res) => {
  const { name, email } = req.body;
  const user = await User.findByIdAndUpdate(
    req.user._id,
    { name, email },
    { new: true }
  ).select('-password');
  res.json(user);
});

exports.getUsers = asyncHandler(async (req, res) => {
  const users = await User.find({}).select('name email role');
  res.json(users);
});

exports.getUserById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: 'Invalid user ID format' });
  }
  
  const user = await User.findById(id).select('-password');
  if (!user) return res.status(404).json({ message: 'User not found' });
  res.json(user);
});

exports.searchUsers = asyncHandler(async (req, res) => {
  const { query } = req.query;
  const users = await User.find({
    $or: [
      { name: { $regex: query, $options: 'i' } },
      { email: { $regex: query, $options: 'i' } }
    ]
  }).select('name email role').limit(10);
  res.json(users);
});

exports.updateUserRole = asyncHandler(async (req, res) => {
  const { role } = req.body;
  const { userId } = req.params;

  const validRoles = ['admin', 'pm', 'member', 'guest'];
  if (!validRoles.includes(role)) {
    return res.status(400).json({ 
      message: 'Invalid role. Valid roles are: admin, pm, member, guest' 
    });
  }

  if (userId === req.user._id.toString()) {
    return res.status(400).json({ message: 'Cannot change your own role' });
  }

  const user = await User.findByIdAndUpdate(
    userId,
    { role },
    { new: true }
  ).select('-password');

  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }

  res.json({
    message: `User role updated to ${role}`,
    user
  });
});

exports.getUsersWithRoles = asyncHandler(async (req, res) => {
  const users = await User.find({})
    .select('name email role createdAt')
    .sort({ createdAt: -1 });

  res.json(users);
});
