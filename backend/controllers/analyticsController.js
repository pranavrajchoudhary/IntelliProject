const Task = require('../models/Task');
const Project = require('../models/Project');
const Activity = require('../models/Activity');
const User = require('../models/User');
const asyncHandler = require('../utils/asyncHandler');

exports.getDashboardStats = asyncHandler(async (req, res) => {
  const userProjects = await Project.find({ members: req.user._id }).select('_id');
  const projectIds = userProjects.map(p => p._id);

  const [totalTasks, completedTasks, inProgressTasks, totalProjects, recentActivities] = await Promise.all([
    Task.countDocuments({ project: { $in: projectIds } }),
    Task.countDocuments({ project: { $in: projectIds }, status: 'done' }),
    Task.countDocuments({ project: { $in: projectIds }, status: 'inprogress' }),
    Project.countDocuments({ members: req.user._id }),
    Activity.find({ project: { $in: projectIds } })
      .populate('user', 'name')
      .populate('project', 'title')
      .sort({ createdAt: -1 })
      .limit(10)
  ]);

  // Task completion over time (last 7 days)
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  
  const taskCompletionData = await Task.aggregate([
    {
      $match: {
        project: { $in: projectIds },
        status: 'done',
        updatedAt: { $gte: sevenDaysAgo }
      }
    },
    {
      $group: {
        _id: {
          $dateToString: { format: '%Y-%m-%d', date: '$updatedAt' }
        },
        count: { $sum: 1 }
      }
    },
    { $sort: { _id: 1 } }
  ]);

  // Project progress
  const projectProgress = await Project.aggregate([
    { $match: { members: req.user._id } },
    {
      $lookup: {
        from: 'tasks',
        localField: '_id',
        foreignField: 'project',
        as: 'tasks'
      }
    },
    {
      $project: {
        title: 1,
        totalTasks: { $size: '$tasks' },
        completedTasks: {
          $size: {
            $filter: {
              input: '$tasks',
              cond: { $eq: ['$$this.status', 'done'] }
            }
          }
        }
      }
    }
  ]);

  res.json({
    stats: {
      totalTasks,
      completedTasks,
      inProgressTasks,
      totalProjects,
      completionRate: totalTasks > 0 ? ((completedTasks / totalTasks) * 100).toFixed(1) : 0
    },
    taskCompletionData,
    projectProgress,
    recentActivities
  });
});

exports.getProjectAnalytics = asyncHandler(async (req, res) => {
  const projectId = req.params.projectId;
  
  const [tasks, activities] = await Promise.all([
    Task.find({ project: projectId }),
    Activity.find({ project: projectId })
      .populate('user', 'name')
      .sort({ createdAt: -1 })
      .limit(20)
  ]);

  const tasksByStatus = {
    todo: tasks.filter(t => t.status === 'todo').length,
    inprogress: tasks.filter(t => t.status === 'inprogress').length,
    done: tasks.filter(t => t.status === 'done').length
  };

  // Task creation over time
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  const taskCreationData = await Task.aggregate([
    {
      $match: {
        project: projectId,
        createdAt: { $gte: thirtyDaysAgo }
      }
    },
    {
      $group: {
        _id: {
          $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
        },
        count: { $sum: 1 }
      }
    },
    { $sort: { _id: 1 } }
  ]);

  res.json({
    tasksByStatus,
    taskCreationData,
    activities,
    totalTasks: tasks.length,
    completionRate: tasks.length > 0 ? ((tasksByStatus.done / tasks.length) * 100).toFixed(1) : 0
  });
});
