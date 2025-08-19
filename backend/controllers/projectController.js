const Project = require('../models/Project');
const User = require('../models/User');
const Task = require('../models/Task');
const asyncHandler = require('../utils/asyncHandler');

// Create project - Any authenticated user can create
const createProject = asyncHandler(async (req, res) => {
  const { title, description, members } = req.body;
  
  const project = await Project.create({
    title,
    description,
    owner: req.user._id,
    members: [req.user._id, ...(members || [])]
  });

  await project.populate('owner', 'name email');
  await project.populate('members', 'name email');
  
  res.status(201).json(project);
});

// Get projects - Role-based filtering
const getProjects = asyncHandler(async (req, res) => {
  const user = req.user;
  let query = {};

  // Admin sees all projects
  if (user.role === 'admin') {
    query = {};
  }
  // PM sees projects they own
  else if (user.role === 'pm') {
    query = { owner: user._id };
  }
  // Members see projects they belong to
  else {
    query = { members: user._id };
  }

  const projects = await Project.find(query)
    .populate('owner', 'name email')
    .populate('members', 'name email')
    .sort({ createdAt: -1 });

  // Add task counts
  const projectsWithStats = await Promise.all(
    projects.map(async (project) => {
      const tasks = await Task.find({ project: project._id });
      return {
        ...project.toObject(),
        taskCount: tasks.length,
        completedTasks: tasks.filter(t => t.status === 'done').length,
        pendingTasks: tasks.filter(t => t.status !== 'done').length
      };
    })
  );

  res.json(projectsWithStats);
});

// Get project by ID - Access controlled by middleware
const getProjectById = asyncHandler(async (req, res) => {
  // req.project is set by authorizeProjectAccess middleware
  const project = req.project;
  
  await project.populate('owner', 'name email');
  await project.populate('members', 'name email');
  
  res.json(project);
});

// Update project - Only admins and project owners
const updateProject = asyncHandler(async (req, res) => {
  const { title, description, members } = req.body;
  const project = req.project;
  const user = req.user;

  // Check permissions
  const canUpdate = user.role === 'admin' || 
                   project.owner.toString() === user._id.toString();

  if (!canUpdate) {
    return res.status(403).json({ 
      message: 'Only admins and project owners can update projects' 
    });
  }

  const updatedProject = await Project.findByIdAndUpdate(
    req.params.id,
    {
      ...(title && { title }),
      ...(description !== undefined && { description }),
      ...(members && { members })
    },
    { new: true }
  ).populate('owner', 'name email')
   .populate('members', 'name email');

  res.json(updatedProject);
});

// Delete project - Only admins
const deleteProject = asyncHandler(async (req, res) => {
  const project = req.project;

  // Delete all tasks in the project
  await Task.deleteMany({ project: project._id });
  
  // Delete the project
  await Project.findByIdAndDelete(project._id);
  
  res.json({ message: 'Project and all associated tasks deleted successfully' });
});

// Add member - Only admins and project owners
const addMember = asyncHandler(async (req, res) => {
  const { memberId } = req.body;
  const project = req.project;
  const user = req.user;

  // Check permissions
  const canAddMember = user.role === 'admin' || 
                      project.owner.toString() === user._id.toString();

  if (!canAddMember) {
    return res.status(403).json({ 
      message: 'Only admins and project owners can add members' 
    });
  }

  // Validate member exists
  const memberUser = await User.findById(memberId);
  if (!memberUser) {
    return res.status(404).json({ message: 'User not found' });
  }

  // Check if already a member
  if (project.members.includes(memberId)) {
    return res.status(400).json({ message: 'User is already a project member' });
  }

  // Add member
  project.members.push(memberId);
  await project.save();

  const populatedProject = await Project.findById(project._id)
    .populate('owner', 'name email')
    .populate('members', 'name email');

  res.json(populatedProject);
});

// Remove member - Only admins and project owners  
const removeMember = asyncHandler(async (req, res) => {
  const { memberId } = req.params;
  const project = req.project;
  const user = req.user;

  // Check permissions
  const canRemoveMember = user.role === 'admin' || 
                         project.owner.toString() === user._id.toString();

  if (!canRemoveMember) {
    return res.status(403).json({ 
      message: 'Only admins and project owners can remove members' 
    });
  }

  // Cannot remove project owner
  if (memberId === project.owner.toString()) {
    return res.status(400).json({ message: 'Cannot remove project owner' });
  }

  // Remove member
  project.members = project.members.filter(
    member => member.toString() !== memberId
  );
  await project.save();

  // Also unassign from all tasks in this project
  await Task.updateMany(
    { project: project._id, assignee: memberId },
    { $unset: { assignee: 1 } }
  );

  const populatedProject = await Project.findById(project._id)
    .populate('owner', 'name email')
    .populate('members', 'name email');

  res.json(populatedProject);
});

module.exports = {
  createProject,
  getProjects,
  getProjectById,
  updateProject,
  deleteProject,
  addMember,
  removeMember
};
