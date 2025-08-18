const User = require('../models/User');
const asyncHandler = require('../utils/asyncHandler');

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

// Get user by ID
exports.getUserById = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id).select('-password');
  if (!user) return res.status(404).json({ message: 'User not found' });
  res.json(user);
});

// Search users
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
