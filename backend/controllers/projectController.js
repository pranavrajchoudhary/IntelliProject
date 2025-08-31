const Project = require('../models/Project');
const User = require('../models/User');
const Task = require('../models/Task');
const asyncHandler = require('../utils/asyncHandler');

const createProject = asyncHandler(async (req, res) => {
  const { title, description, members } = req.body;

  const projectMembers = [req.user._id];
  if (members && Array.isArray(members)) {
    members.forEach(memberId => {
      if (!projectMembers.includes(memberId)) {
        projectMembers.push(memberId);
      }
    });
  }
  
  const project = await Project.create({
    title,
    description,
    owner: req.user._id,
    members: projectMembers
  });

  await project.populate('owner', 'name email');
  await project.populate('members', 'name email');
  
  res.status(201).json(project);
});

const getProjects = asyncHandler(async (req, res) => {
  const user = req.user;
  let query = {};

  if (user.role === 'admin') {
    query = {};
  }
  else if (user.role === 'pm') {
    query = {
      $or: [
        { owner: user._id },
        { members: { $in: [user._id] } }
      ]
    };
  }
 else {
    query = { members: { $in: [user._id] } };  
  }


  const projects = await Project.find(query)
    .populate('owner', 'name email')
    .populate('members', 'name email')
    .sort({ createdAt: -1 });

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

const getProjectById = asyncHandler(async (req, res) => {
  const project = req.project;
  
  await project.populate('owner', 'name email');
  await project.populate('members', 'name email');
  
  res.json(project);
});

const updateProject = asyncHandler(async (req, res) => {
  const { title, description, members } = req.body;
  const project = req.project;
  const user = req.user;

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

const deleteProject = asyncHandler(async (req, res) => {
  const project = req.project;
  const user = req.user;

  const canDelete = user.role === 'admin' || project.owner.toString() === user._id.toString();

  if (!canDelete) {
    return res.status(403).json({
      message: 'Only admins and project owners can delete projects'
    });
  }

  await Task.deleteMany({ project: project._id });

  await Project.findByIdAndDelete(project._id);

  res.json({ message: 'Project and all associated tasks deleted successfully' });
});

const addMember = asyncHandler(async (req, res) => {
  const { memberId } = req.body;
  const project = req.project;
  const user = req.user;

  const canAddMember = user.role === 'admin' || 
                      project.owner.toString() === user._id.toString();

  if (!canAddMember) {
    return res.status(403).json({ 
      message: 'Only admins and project owners can add members' 
    });
  }

  const memberUser = await User.findById(memberId);
  if (!memberUser) {
    return res.status(404).json({ message: 'User not found' });
  }

  if (project.members.includes(memberId)) {
    return res.status(400).json({ message: 'User is already a project member' });
  }

  project.members.push(memberId);
  await project.save();

  const populatedProject = await Project.findById(project._id)
    .populate('owner', 'name email')
    .populate('members', 'name email');

  res.json(populatedProject);
});

const removeMember = asyncHandler(async (req, res) => {
  const { memberId } = req.params;
  const project = req.project;
  const user = req.user;

  const canRemoveMember = user.role === 'admin' || 
                         project.owner.toString() === user._id.toString();

  if (!canRemoveMember) {
    return res.status(403).json({ 
      message: 'Only admins and project owners can remove members' 
    });
  }

  if (memberId === project.owner.toString()) {
    return res.status(400).json({ message: 'Cannot remove project owner' });
  }

  project.members = project.members.filter(
    member => member.toString() !== memberId
  );
  await project.save();

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
