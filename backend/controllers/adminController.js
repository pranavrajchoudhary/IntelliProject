const User = require('../models/User');
const ActivityLog = require('../models/ActivityLog');
const Project = require('../models/Project');
const Task = require('../models/Task');
const asyncHandler = require('../utils/asyncHandler');

exports.getAllUsers = asyncHandler(async (req, res) => {
  const users = await User.find({})
    .select('-password')
    .sort({ createdAt: -1 });
  
  res.json(users);
});

exports.getUserActivities = asyncHandler(async (req, res) => {
  const activities = await ActivityLog.find({})
    .populate('user', 'name email')
    .sort({ timestamp: -1 })
    .limit(500);
  
  res.json(activities);
});

exports.getAdminStats = asyncHandler(async (req, res) => {
  const totalUsers = await User.countDocuments();
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const activeToday = await ActivityLog.countDocuments({
    timestamp: { $gte: today },
    type: 'login'
  });
  
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const newThisWeek = await User.countDocuments({
    createdAt: { $gte: weekAgo }
  });
  
  const suspended = await User.countDocuments({ suspended: true });
  
  res.json({
    totalUsers,
    activeToday,
    newThisWeek,
    suspended
  });
});

exports.updateUser = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const { name, email, role, suspended } = req.body;
  
  const user = await User.findByIdAndUpdate(
    userId,
    { name, email, role, suspended },
    { new: true }
  ).select('-password');
  
  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }
  
  // Log the activity
  await ActivityLog.create({
    user: req.user._id,
    type: 'update',
    description: `updated user ${user.name}`,
    metadata: { targetUser: userId, changes: req.body }
  });
  
  res.json(user);
});

exports.deleteUser = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  
  const user = await User.findById(userId);
  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }
  
  await User.findByIdAndDelete(userId);
  
  // Log the activity
  await ActivityLog.create({
    user: req.user._id,
    type: 'delete',
    description: `deleted user ${user.name}`,
    metadata: { targetUser: userId }
  });
  
  res.json({ message: 'User deleted successfully' });
});

exports.suspendUser = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const { suspended } = req.body;
  
  const user = await User.findByIdAndUpdate(
    userId,
    { suspended },
    { new: true }
  ).select('-password');
  
  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }
  
  // Log the activity
  await ActivityLog.create({
    user: req.user._id,
    type: 'update',
    description: `${suspended ? 'suspended' : 'reactivated'} user ${user.name}`,
    metadata: { targetUser: userId, suspended }
  });
  
  res.json(user);
});
