const Project = require('../models/Project');
const asyncHandler = require('../utils/asyncHandler');

exports.createProject = asyncHandler(async (req, res) => {
  const { title, description, members } = req.body;
  const project = await Project.create({ title, description, owner: req.user._id, members: members || [req.user._id] });
  res.status(201).json(project);
});

exports.getProjects = asyncHandler(async (req, res) => {
  const projects = await Project.find({ members: req.user._id })
    .populate('owner', 'name email')
    .populate('members', 'name email');
    
  // Clean up any null members
  const cleanedProjects = projects.map(project => ({
    ...project.toObject(),
    members: project.members.filter(member => member && member.name)
  }));
    
  res.json(cleanedProjects);
});


exports.getProjectById = asyncHandler(async (req, res) => {
  const project = await Project.findById(req.params.id)
    .populate('members', 'name email')
    .populate('owner', 'name email');
    
  if (!project) return res.status(404).json({ message: 'Project not found' });
  
  //Filters out any null members that might exist
  project.members = project.members.filter(member => member && member.name);
  
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
  const { memberId } = req.body;
  
  // Validates if member exists
  const memberUser = await User.findById(memberId);
  if (!memberUser) {
    return res.status(404).json({ message: 'User not found' });
  }

  const project = await Project.findById(req.params.id);
  if (!project) {
    return res.status(404).json({ message: 'Project not found' });
  }

  //Check if member is already added
  if (!project.members.includes(memberId)) {
    project.members.push(memberId);
    await project.save();
  }

  //Return populated project with member details
  const populatedProject = await Project.findById(req.params.id).populate('members', 'name email');
  res.json(populatedProject);
});

