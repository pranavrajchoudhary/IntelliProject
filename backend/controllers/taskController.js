const Task = require('../models/Task');
const Project = require('../models/Project');
const User = require('../models/User');
const asyncHandler = require('../utils/asyncHandler');

const createTask = asyncHandler(async (req, res) => {
  const { title, description, projectId, assignees, dueDate, status } = req.body;

  const project = await Project.findById(projectId);
  if (!project) {
    return res.status(404).json({ message: 'Project not found' });
  }

  const user = req.user;
  const canCreate = user.role === 'admin' ||
    project.owner.toString() === user._id.toString() ||
    project.members.includes(user._id);

  if (!canCreate) {
    return res.status(403).json({ message: 'You cannot create tasks in this project' });
  }

  let validatedAssignees = [];
  if (assignees && assignees.length > 0) {
    for (const assignee of assignees) {
      const assigneeUser = await User.findById(assignee.user);
      if (!assigneeUser) {
        return res.status(404).json({ message: `Assignee ${assignee.user} not found` });
      }
      
      if (!project.members.includes(assignee.user)) {
        return res.status(400).json({ message: 'All assignees must be project members' });
      }
      
      validatedAssignees.push({
        user: assignee.user,
        role: assignee.role
      });
    }
  }

  const task = await Task.create({
    title,
    description,
    project: projectId,
    assignees: validatedAssignees,
    dueDate: dueDate || null,
    status: status || 'todo',
    createdBy: user._id
  });

  await task.populate('assignees.user', 'name email');
  await task.populate('createdBy', 'name email');
  res.status(201).json(task);
});

const getProjectTasks = asyncHandler(async (req, res) => {
  const { projectId } = req.params;

  const tasks = await Task.find({ project: projectId })
    .populate('assignees.user', 'name email')
    .populate('createdBy', 'name email')
    .sort({ position: 1, createdAt: -1 });

  res.json(tasks);
});

const getTask = asyncHandler(async (req, res) => {
  const task = await Task.findById(req.params.id)
    .populate('assignees.user', 'name email')
    .populate('createdBy', 'name email')
    .populate('project', 'title');

  if (!task) {
    return res.status(404).json({ message: 'Task not found' });
  }

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

const updateTask = asyncHandler(async (req, res) => {
  const { title, description, status, assignees, dueDate, position } = req.body;
  
  const task = await Task.findById(req.params.id).populate('assignees.user');
  if (!task) {
    return res.status(404).json({ message: 'Task not found' });
  }

  const project = await Project.findById(task.project);
  const user = req.user;

  const isAdmin = user.role === 'admin';
  const isProjectManager = project.owner.toString() === user._id.toString();
  const isAssignee = task.assignees.some(assignee => 
    assignee.user._id.toString() === user._id.toString()
  );

  if (status && status !== task.status) {
    if (!isAdmin && !isProjectManager && !isAssignee) {
      return res.status(403).json({
        message: 'Only admins, project managers, or assignees can change task status'
      });
    }
  }

  if ((title || description || assignees) && !isAdmin && !isProjectManager) {
    return res.status(403).json({
      message: 'Only admins and project managers can update task details'
    });
  }

  let validatedAssignees = task.assignees;
  if (assignees) {
    validatedAssignees = [];
    for (const assignee of assignees) {
      const assigneeUser = await User.findById(assignee.user);
      if (!assigneeUser) {
        return res.status(404).json({ message: `Assignee ${assignee.user} not found` });
      }
      
      if (!project.members.includes(assignee.user)) {
        return res.status(400).json({ message: 'All assignees must be project members' });
      }
      
      validatedAssignees.push({
        user: assignee.user,
        role: assignee.role
      });
    }
  }

  const updatedTask = await Task.findByIdAndUpdate(
    req.params.id,
    {
      ...(title && { title }),
      ...(description !== undefined && { description }),
      ...(status && { status }),
      ...(assignees && { assignees: validatedAssignees }),
      ...(dueDate !== undefined && { dueDate: dueDate || null }),
      ...(position !== undefined && { position })
    },
    { new: true }
  ).populate('assignees.user', 'name email')
   .populate('createdBy', 'name email');

  res.json(updatedTask);
});

const deleteTask = asyncHandler(async (req, res) => {
  const task = await Task.findById(req.params.id);
  if (!task) {
    return res.status(404).json({ message: 'Task not found' });
  }

  const project = await Project.findById(task.project);
  const user = req.user;

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
