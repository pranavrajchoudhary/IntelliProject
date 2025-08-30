const User = require('../models/User');
const ActivityLog = require('../models/ActivityLog');
const Project = require('../models/Project');
const Task = require('../models/Task');
const Message = require('../models/Message');
const asyncHandler = require('../utils/asyncHandler');

exports.getAllUsers = asyncHandler(async (req, res) => {
  const users = await User.find({})
    .select('-password')
    .populate('approvedBy', 'name email')
    .sort({ createdAt: -1 });
  
  res.json(users);
});

exports.getPendingRegistrations = asyncHandler(async (req, res) => {
  const pendingUsers = await User.find({ status: 'pending' })
    .select('-password')
    .sort({ createdAt: -1 });
  
  res.json(pendingUsers);
});

exports.approveRegistration = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const { approved, rejectionReason } = req.body;
  
  const user = await User.findById(userId);
  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }

  if (user.status !== 'pending') {
    return res.status(400).json({ message: 'User is not pending approval' });
  }

  if (approved) {
    user.status = 'approved';
    user.approvedBy = req.user._id;
    user.approvedAt = new Date();
  } else {
    user.status = 'rejected';
    user.rejectionReason = rejectionReason || 'Registration rejected by administrator';
  }

  await user.save();

  try {
    await ActivityLog.create({
      user: req.user._id,
      type: 'update',
      description: `${approved ? 'Approved' : 'Rejected'} registration for ${user.name} (${user.email})`,
      metadata: { 
        action: approved ? 'approve_registration' : 'reject_registration',
        targetUser: userId, 
        targetUserName: user.name,
        targetUserEmail: user.email,
        userRole: user.role,
        rejectionReason: approved ? null : rejectionReason
      }
    });
  } catch (activityError) {
    console.log('ActivityLog creation failed:', activityError.message);
  }

  res.json({ 
    message: `User ${approved ? 'approved' : 'rejected'} successfully`,
    user: {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status
    }
  });
});

exports.getUserActivities = asyncHandler(async (req, res) => {
  const activities = await ActivityLog.find({})
    .populate('user', 'name email role')
    .sort({ timestamp: -1 })
    .limit(500);
  
  res.json(activities);
});

exports.getAdminStats = asyncHandler(async (req, res) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const monthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  // User statistics
  const totalUsers = await User.countDocuments({ status: 'approved' });
  const pendingRegistrations = await User.countDocuments({ status: 'pending' });
  const suspendedUsers = await User.countDocuments({ suspended: true });
  
  // Active users today (based on login activity)
  const activeToday = await ActivityLog.countDocuments({
    timestamp: { $gte: today },
    type: 'login'
  });

  // Active users yesterday
  const activeYesterday = await ActivityLog.countDocuments({
    timestamp: { $gte: yesterday, $lt: today },
    type: 'login'
  });

  // New registrations this week
  const newThisWeek = await User.countDocuments({
    createdAt: { $gte: weekAgo },
    status: { $in: ['approved', 'pending'] }
  });

  // Role distribution
  const roleStats = await User.aggregate([
    { $match: { status: 'approved' } },
    { $group: { _id: '$role', count: { $sum: 1 } } }
  ]);

  // Project statistics
  const totalProjects = await Project.countDocuments();
  const activeProjects = await Project.countDocuments({ 
    status: { $in: ['active', 'in-progress'] } 
  });

  // Task statistics
  const totalTasks = await Task.countDocuments();
  const completedTasks = await Task.countDocuments({ status: 'completed' });
  const overdueTasks = await Task.countDocuments({
    dueDate: { $lt: new Date() },
    status: { $ne: 'completed' }
  });

  // Activity trends (last 7 days)
  const activityTrends = await ActivityLog.aggregate([
    {
      $match: {
        timestamp: { $gte: weekAgo }
      }
    },
    {
      $group: {
        _id: {
          date: { $dateToString: { format: "%Y-%m-%d", date: "$timestamp" } },
          type: "$type"
        },
        count: { $sum: 1 }
      }
    },
    {
      $sort: { "_id.date": 1 }
    }
  ]);

  // Recent activities
  const recentActivities = await ActivityLog.find({})
    .populate('user', 'name email role')
    .sort({ timestamp: -1 })
    .limit(10);

  res.json({
    users: {
      total: totalUsers,
      activeToday,
      activeYesterday,
      newThisWeek,
      pending: pendingRegistrations,
      suspended: suspendedUsers,
      roleDistribution: roleStats.reduce((acc, role) => {
        acc[role._id] = role.count;
        return acc;
      }, {})
    },
    projects: {
      total: totalProjects,
      active: activeProjects
    },
    tasks: {
      total: totalTasks,
      completed: completedTasks,
      overdue: overdueTasks,
      completionRate: totalTasks > 0 ? ((completedTasks / totalTasks) * 100).toFixed(1) : 0
    },
    activityTrends,
    recentActivities
  });
});

exports.updateUser = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const { name, email, role, suspended } = req.body;
  
  const user = await User.findById(userId);
  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }

  const oldRole = user.role;
  const oldSuspended = user.suspended;

  // Store original role if changing from a higher privilege role
  if (role && role !== oldRole) {
    if (!user.originalRole && ['admin', 'pm'].includes(oldRole)) {
      user.originalRole = oldRole;
    }
  }

  // Update user fields
  if (name) user.name = name;
  if (email) user.email = email;
  if (role) user.role = role;
  if (suspended !== undefined) user.suspended = suspended;

  await user.save();

  // Update user's project memberships based on role change
  if (role && role !== oldRole) {
    await updateUserProjectPermissions(userId, oldRole, role);
  }

  // Log the activity
  const changes = [];
  if (name && name !== user.name) changes.push(`name to ${name}`);
  if (email && email !== user.email) changes.push(`email to ${email}`);
  if (role && role !== oldRole) changes.push(`role from ${oldRole} to ${role}`);
  if (suspended !== undefined && suspended !== oldSuspended) {
    changes.push(`${suspended ? 'suspended' : 'reactivated'} account`);
  }

  try {
    await ActivityLog.create({
      user: req.user._id,
      type: 'update',
      description: `updated user ${user.name}: ${changes.join(', ')}`,
      metadata: { 
        targetUser: userId, 
        changes: req.body,
        oldRole,
        newRole: role
      }
    });
  } catch (activityError) {
    console.log('ActivityLog creation failed:', activityError.message);
  }

  const updatedUser = await User.findById(userId).select('-password');
  res.json(updatedUser);
});

exports.deleteUser = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  
  const user = await User.findById(userId);
  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }

  // Remove user from all projects
  await Project.updateMany(
    { members: userId },
    { $pull: { members: userId } }
  );

  // Update tasks assigned to this user
  await Task.updateMany(
    { assignee: userId },
    { $unset: { assignee: 1 } }
  );

  await User.findByIdAndDelete(userId);

  try {
    await ActivityLog.create({
      user: req.user._id,
      type: 'delete',
      description: `deleted user ${user.name}`,
      metadata: { targetUser: userId, deletedUserEmail: user.email }
    });
  } catch (activityError) {
    console.log('ActivityLog creation failed:', activityError.message);
  }
  
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
  
  try {
    await ActivityLog.create({
      user: req.user._id,
      type: 'update',
      description: `${suspended ? 'suspended' : 'reactivated'} user ${user.name}`,
      metadata: { targetUser: userId, suspended }
    });
  } catch (activityError) {
    console.log('ActivityLog creation failed:', activityError.message);
  }
  
  res.json(user);
});

exports.restoreUserRole = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  
  const user = await User.findById(userId);
  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }

  if (!user.originalRole) {
    return res.status(400).json({ message: 'No original role to restore' });
  }

  const oldRole = user.role;
  user.role = user.originalRole;
  user.originalRole = undefined;
  await user.save();

  // Update project permissions
  await updateUserProjectPermissions(userId, oldRole, user.role);

  try {
    await ActivityLog.create({
      user: req.user._id,
      type: 'update',
      description: `restored ${user.name}'s role from ${oldRole} to ${user.role}`,
      metadata: { targetUser: userId, oldRole, restoredRole: user.role }
    });
  } catch (activityError) {
    console.log('ActivityLog creation failed:', activityError.message);
  }

  res.json(user);
});

// Helper function to update user project permissions based on role change
async function updateUserProjectPermissions(userId, oldRole, newRole) {
  // This function handles project permission updates when user role changes
  // The user remains in projects but their permissions are based on their new role
  
  try {
    await ActivityLog.create({
      user: userId,
      type: 'update',
      description: `role changed from ${oldRole} to ${newRole}, project permissions updated`,
      metadata: { 
        action: 'role_change',
        oldRole, 
        newRole 
      }
    });
  } catch (activityError) {
    console.log('ActivityLog creation failed:', activityError.message);
  }
}
