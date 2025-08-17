const Project = require('../models/Project');
const asyncHandler = require('../utils/asyncHandler');

exports.createProject = asyncHandler(async (req, res) => {
  const { title, description, members } = req.body;
  const project = await Project.create({ title, description, owner: req.user._id, members: members || [req.user._id] });
  res.status(201).json(project);
});

exports.getProjects = asyncHandler(async (req, res) => {
  const projects = await Project.find({ members: req.user._id }).populate('owner', 'name email');
  res.json(projects);
});

exports.getProjectById = asyncHandler(async (req, res) => {
  const project = await Project.findById(req.params.id).populate('members','name email');
  if (!project) return res.status(404).json({ message: 'Project not found' });
  res.json(project);
});

exports.updateProject = asyncHandler(async (req, res) => {
  const project = await Project.findByIdAndUpdate(req.params.id, req.body, { new: true });
  res.json(project);
});

exports.deleteProject = asyncHandler(async (req, res) => {
  await Project.findByIdAndDelete(req.params.id);
  res.json({ message: 'Project deleted' });
});

exports.addMember = asyncHandler(async (req, res) => {
  const project = await Project.findById(req.params.id);
  if (!project) return res.status(404).json({ message: 'Project not found' });
  if (!project.members.includes(req.body.memberId)) project.members.push(req.body.memberId);
  await project.save();
  res.json(project);
});
