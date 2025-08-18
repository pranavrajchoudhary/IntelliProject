const Activity = require('../models/Activity');
const asyncHandler = require('../utils/asyncHandler');

exports.getProjectActivities = asyncHandler(async (req, res) => {
  const activities = await Activity.find({ project: req.params.projectId })
    .populate('user', 'name email')
    .sort({ createdAt: -1 })
    .limit(50);
  res.json(activities);
});

exports.getUserActivities = asyncHandler(async (req, res) => {
  const activities = await Activity.find({ user: req.user._id })
    .populate('project', 'title')
    .sort({ createdAt: -1 })
    .limit(50);
  res.json(activities);
});

exports.createActivity = async (userId, projectId, action, description, entityType, entityId = null, metadata = {}) => {
  try {
    await Activity.create({
      user: userId,
      project: projectId,
      action,
      description,
      entityType,
      entityId,
      metadata
    });
  } catch (error) {
    console.error('Failed to create activity:', error);
  }
};
