const Task = require('../models/Task');
const Project = require('../models/Project');
const User = require('../models/User');
const asyncHandler = require('../utils/asyncHandler');

// Create task - Any project member
const createTask = asyncHandler(async (req, res) => {
  const { title, description, projectId, assignee, dueDate, status } = req.body;
  
  // Verify project exists and user has access
  const project = await Project.findById(projectId);
  if (!project) {
    return res.status(404).json({ message: 'Project not found' });
  }

  // Check if user can create tasks in this project
  const user = req.user;
  const canCreate = user.role === 'admin' || 
                   project.owner.toString() === user._id.toString() ||
                   project.members.includes(user._id);

  if (!canCreate) {
    return res.status(403).json({ message: 'You cannot create tasks in this project' });
  }

  // If assignee is specified, verify they're a project member
  if (assignee) {
    const assigneeUser = await User.findById(assignee);
    if (!assigneeUser) {
      return res.status(404).json({ message: 'Assignee not found' });
    }
    
    if (!project.members.includes(assignee)) {
      return res.status(400).json({ message: 'Assignee must be a project member' });
    }
  }

  const task = await Task.create({
    title,
    description,
    project: projectId,
    assignee: assignee || null,
    dueDate: dueDate || null,
    status: status || 'todo',
    createdBy: user._id
  });

  await task.populate('assignee', 'name email');
  res.status(201).json(task);
});

// Get project tasks - Members can view tasks in their projects
const getProjectTasks = asyncHandler(async (req, res) => {
  const { projectId } = req.params;
  
  // Authorization already handled by middleware
  const tasks = await Task.find({ project: projectId })
    .populate('assignee', 'name email')
    .populate('createdBy', 'name email')
    .sort({ position: 1, createdAt: -1 });

  res.json(tasks);
});

// Get single task
const getTask = asyncHandler(async (req, res) => {
  const task = await Task.findById(req.params.id)
    .populate('assignee', 'name email')
    .populate('createdBy', 'name email')
    .populate('project', 'title');

  if (!task) {
    return res.status(404).json({ message: 'Task not found' });
  }

  // Check if user can view this task
  const project = await Project.findById(task.project._id);
  const user = req.user;
  
  const canView = user.role === 'admin' ||
                 project.owner.toString() === user._id.toString() ||
                 project.members.includes(user._id);

  if (!canView) {
    return res.status(403).json({ message: 'Access denied' });
  }

  res.json(task);
});

// Update task - Only admins and project owners
const updateTask = asyncHandler(async (req, res) => {
  const { title, description, status, assignee, dueDate, position } = req.body;
  
  const task = await Task.findById(req.params.id);
  if (!task) {
    return res.status(404).json({ message: 'Task not found' });
  }

  const project = await Project.findById(task.project);
  const user = req.user;

  // Check permissions
  const canUpdate = user.role === 'admin' || 
                   project.owner.toString() === user._id.toString();

  if (!canUpdate) {
    return res.status(403).json({ 
      message: 'Only admins and project managers can update tasks' 
    });
  }

  // If updating assignee, verify they're a project member
  if (assignee && assignee !== task.assignee?.toString()) {
    if (assignee !== null) {
      const assigneeUser = await User.findById(assignee);
      if (!assigneeUser) {
        return res.status(404).json({ message: 'Assignee not found' });
      }
      
      if (!project.members.includes(assignee)) {
        return res.status(400).json({ message: 'Assignee must be a project member' });
      }
    }
  }

  // Update task
  const updatedTask = await Task.findByIdAndUpdate(
    req.params.id,
    {
      ...(title && { title }),
      ...(description !== undefined && { description }),
      ...(status && { status }),
      ...(assignee !== undefined && { assignee: assignee || null }),
      ...(dueDate !== undefined && { dueDate: dueDate || null }),
      ...(position !== undefined && { position })
    },
    { new: true }
  ).populate('assignee', 'name email')
   .populate('createdBy', 'name email');

  res.json(updatedTask);
});

// Delete task - Only admins and project owners
const deleteTask = asyncHandler(async (req, res) => {
  const task = await Task.findById(req.params.id);
  if (!task) {
    return res.status(404).json({ message: 'Task not found' });
  }

  const project = await Project.findById(task.project);
  const user = req.user;

  // Check permissions
  const canDelete = user.role === 'admin' || 
                   project.owner.toString() === user._id.toString();

  if (!canDelete) {
    return res.status(403).json({ 
      message: 'Only admins and project managers can delete tasks' 
    });
  }

  await Task.findByIdAndDelete(req.params.id);
  res.json({ message: 'Task deleted successfully' });
});

module.exports = {
  createTask,
  getProjectTasks,
  getTask,
  updateTask,
  deleteTask
};
