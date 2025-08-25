const Task = require('../models/Task');
const Project = require('../models/Project');
const Activity = require('../models/Activity');
const User = require('../models/User');
const StatSnapshot = require('../models/StatSnapshot');
const asyncHandler = require('../utils/asyncHandler');

//Gets user's latest snapshot info
exports.getLatestSnapshot = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  
  const latestSnapshot = await StatSnapshot.findOne({ user: userId })
    .sort({ date: -1 })
    .select('date createdAt');
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  res.json({
    hasSnapshot: !!latestSnapshot,
    isToday: latestSnapshot && latestSnapshot.date >= today,
    lastSnapshotDate: latestSnapshot?.date || null
  });
});

//Gets current dashboard stats with trends for specific user
exports.getDashboardStats = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  
  //Gets user's projects (where user is member)
  const userProjects = await Project.find({ members: userId }).select('_id');
  const projectIds = userProjects.map(p => p._id);

  const [totalTasks, completedTasks, inProgressTasks, totalProjects, recentActivities] = await Promise.all([
    Task.countDocuments({ project: { $in: projectIds } }),
    Task.countDocuments({ project: { $in: projectIds }, status: 'done' }),
    Task.countDocuments({ project: { $in: projectIds }, status: 'inprogress' }),
    Project.countDocuments({ members: userId }),
    Activity.find({ project: { $in: projectIds } })
      .populate('user', 'name')
      .populate('project', 'title')
      .sort({ createdAt: -1 })
      .limit(10)
  ]);

  //Gets all users that are in user's projects (team members)
  const allProjectMembers = await Project.find({ members: userId })
    .populate('members', '_id')
    .then(projects => {
      const memberIds = new Set();
      projects.forEach(project => {
        project.members.forEach(member => memberIds.add(member._id.toString()));
      });
      return memberIds.size;
    });

  //Current stats for this user
  const currentStats = {
    totalProjects,
    totalTasks,
    completedTasks,
    teamMembers: allProjectMembers
  };

  //Gets latest snapshot for this user for trend calculation
  const latestSnapshot = await StatSnapshot.findOne({ user: userId }).sort({ date: -1 });
  
  let trends = {
    projectsChange: 0,
    projectsPercentage: 0,
    tasksChange: 0,
    tasksPercentage: 0,
    completedChange: 0,
    completedPercentage: 0,
    membersChange: 0,
    membersPercentage: 0
  };

  if (latestSnapshot) {
    const { stats: prevStats } = latestSnapshot;
    
    trends = {
      projectsChange: currentStats.totalProjects - prevStats.totalProjects,
      projectsPercentage: prevStats.totalProjects > 0 
        ? parseFloat(((currentStats.totalProjects - prevStats.totalProjects) / prevStats.totalProjects * 100).toFixed(1))
        : 0,
      tasksChange: currentStats.totalTasks - prevStats.totalTasks,
      tasksPercentage: prevStats.totalTasks > 0 
        ? parseFloat(((currentStats.totalTasks - prevStats.totalTasks) / prevStats.totalTasks * 100).toFixed(1))
        : 0,
      completedChange: currentStats.completedTasks - prevStats.completedTasks,
      completedPercentage: prevStats.completedTasks > 0 
        ? parseFloat(((currentStats.completedTasks - prevStats.completedTasks) / prevStats.completedTasks * 100).toFixed(1))
        : 0,
      membersChange: currentStats.teamMembers - prevStats.teamMembers,
      membersPercentage: prevStats.teamMembers > 0 
        ? parseFloat(((currentStats.teamMembers - prevStats.teamMembers) / prevStats.teamMembers * 100).toFixed(1))
        : 0
    };
  }

  //Task completion over time (last 7 days)
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

  //Project progress
  const projectProgress = await Project.aggregate([
    { $match: { members: userId } },
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
      ...currentStats,
      completionRate: totalTasks > 0 ? ((completedTasks / totalTasks) * 100).toFixed(1) : 0
    },
    trends,
    taskCompletionData,
    projectProgress,
    recentActivities
  });
});

//Saves daily snapshot for a specific user
exports.saveStatsSnapshot = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { force = false } = req.query;
  const today = new Date();
  today.setHours(0, 0, 0, 0);


  //Checks if snapshot already exists for today
  if (!force) {
    const existingSnapshot = await StatSnapshot.findOne({ 
      user: userId, 
      date: today 
    });
    if (existingSnapshot) {
      //Snapshot exists for today, just return current stats
      return res.json({ 
        message: 'Snapshot already exists for today, returning current stats',
        snapshotExists: true,
        stats: existingSnapshot.stats,
        trends: existingSnapshot.trends
      });
    }
  }
  //Gets user's projects
  const userProjects = await Project.find({ members: userId }).select('_id');
  const projectIds = userProjects.map(p => p._id);

  // Calculate current stats for this user
  const [totalTasks, completedTasks, totalProjects] = await Promise.all([
    Task.countDocuments({ project: { $in: projectIds } }),
    Task.countDocuments({ project: { $in: projectIds }, status: 'done' }),
    Project.countDocuments({ members: userId })
  ]);

  //Gets team members count for this user's projects
  const allProjectMembers = await Project.find({ members: userId })
    .populate('members', '_id')
    .then(projects => {
      const memberIds = new Set();
      projects.forEach(project => {
        project.members.forEach(member => memberIds.add(member._id.toString()));
      });
      return memberIds.size;
    });

  const currentStats = {
    totalProjects,
    totalTasks,
    completedTasks,
    teamMembers: allProjectMembers
  };

  //Gets yesterday's snapshot for this user for trend calculation
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const prevSnapshot = await StatSnapshot.findOne({ 
    user: userId, 
    date: yesterday 
  });

  let trends = {
    projectsChange: 0,
    projectsPercentage: 0,
    tasksChange: 0,
    tasksPercentage: 0,
    completedChange: 0,
    completedPercentage: 0,
    membersChange: 0,
    membersPercentage: 0
  };

  if (prevSnapshot) {
    const { stats: prevStats } = prevSnapshot;
    
    trends = {
      projectsChange: currentStats.totalProjects - prevStats.totalProjects,
      projectsPercentage: prevStats.totalProjects > 0 
        ? parseFloat(((currentStats.totalProjects - prevStats.totalProjects) / prevStats.totalProjects * 100).toFixed(1))
        : 0,
      tasksChange: currentStats.totalTasks - prevStats.totalTasks,
      tasksPercentage: prevStats.totalTasks > 0 
        ? parseFloat(((currentStats.totalTasks - prevStats.totalTasks) / prevStats.totalTasks * 100).toFixed(1))
        : 0,
      completedChange: currentStats.completedTasks - prevStats.completedTasks,
      completedPercentage: prevStats.completedTasks > 0 
        ? parseFloat(((currentStats.completedTasks - prevStats.completedTasks) / prevStats.completedTasks * 100).toFixed(1))
        : 0,
      membersChange: currentStats.teamMembers - prevStats.teamMembers,
      membersPercentage: prevStats.teamMembers > 0 
        ? parseFloat(((currentStats.teamMembers - prevStats.teamMembers) / prevStats.teamMembers * 100).toFixed(1))
        : 0
    };
  }

  //Saves or updates snapshot for this user
  await StatSnapshot.findOneAndUpdate(
    { user: userId, date: today },
    { stats: currentStats, trends },
    { upsert: true, new: true }
  );

  res.json({ 
    message: 'User stats snapshot saved successfully', 
    userId, 
    snapshotExists: false,
    currentStats, 
    trends 
  });
});

//Gets historical trends for a specific user
exports.getHistoricalTrends = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { days = 30 } = req.query;
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const snapshots = await StatSnapshot.find({
    user: userId,
    date: { $gte: startDate }
  }).sort({ date: 1 });

  res.json(snapshots);
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

  //Task creation over time
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
