const Task = require('../models/Task');
const asyncHandler = require('../utils/asyncHandler');

exports.createTask = asyncHandler(async (req, res) => {
  const { title, description, project, assignee, dueDate, position } = req.body;
  const task = await Task.create({ title, description, project, assignee, dueDate, position });
  res.status(201).json(task);
});

exports.getProjectTasks = asyncHandler(async (req, res) => {
  const tasks = await Task.find({ project: req.params.projectId }).sort({ position: 1 });
  res.json(tasks);
});

exports.updateTask = asyncHandler(async (req, res) => {
  const task = await Task.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!task) return res.status(404).json({ message: 'Task not found' });
  res.json(task);
});

exports.deleteTask = asyncHandler(async (req, res) => {
  await Task.findByIdAndDelete(req.params.id);
  res.json({ message: 'Task deleted' });
});
