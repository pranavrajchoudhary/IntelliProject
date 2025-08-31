const Idea = require('../models/Idea');
const Project = require('../models/Project');
const asyncHandler = require('../utils/asyncHandler');

exports.saveIdea = asyncHandler(async (req, res) => {
  const { title, description, category, priority, feasibility, tags, prompt, projectId } = req.body;
  
  const project = await Project.findById(projectId);
  if (!project) {
    return res.status(404).json({ message: 'Project not found' });
  }
  
  const isProjectMember = project.members.some(
    member => member.toString() === req.user._id.toString()
  );
  const isOwner = project.owner.toString() === req.user._id.toString();
  const isAdmin = req.user.role === 'admin';
  
  if (!isProjectMember && !isOwner && !isAdmin) {
    return res.status(403).json({ message: 'Access denied. You must be a project member to save ideas.' });
  }
  
  const idea = await Idea.create({
    title,
    description,
    category,
    priority,
    feasibility,
    tags: tags || [],
    prompt,
    project: projectId,
    createdBy: req.user._id
  });
  
  const populatedIdea = await Idea.findById(idea._id)
    .populate('createdBy', 'name email')
    .populate('project', 'title');
  
  res.status(201).json(populatedIdea);
});

exports.getProjectIdeas = asyncHandler(async (req, res) => {
  const { projectId } = req.params;
  
  const project = await Project.findById(projectId);
  if (!project) {
    return res.status(404).json({ message: 'Project not found' });
  }
  
  const isProjectMember = project.members.some(
    member => member.toString() === req.user._id.toString()
  );
  const isOwner = project.owner.toString() === req.user._id.toString();
  const isAdmin = req.user.role === 'admin';
  
  if (!isProjectMember && !isOwner && !isAdmin) {
    return res.status(403).json({ message: 'Access denied. You must be a project member to view ideas.' });
  }
  
  const ideas = await Idea.find({ project: projectId })
    .populate('createdBy', 'name email')
    .sort({ createdAt: -1 });
  
  res.json(ideas);
});

exports.deleteIdea = asyncHandler(async (req, res) => {
  const { ideaId } = req.params;
  
  const idea = await Idea.findById(ideaId).populate('project');
  if (!idea) {
    return res.status(404).json({ message: 'Idea not found' });
  }
  
  const isCreator = idea.createdBy.toString() === req.user._id.toString();
  const isProjectOwner = idea.project.owner.toString() === req.user._id.toString();
  const isAdmin = req.user.role === 'admin';
  
  if (!isCreator && !isProjectOwner && !isAdmin) {
    return res.status(403).json({ 
      message: 'Access denied. Only the idea creator, project manager, or admin can delete this idea.' 
    });
  }
  
  await Idea.findByIdAndDelete(ideaId);
  
  res.json({ message: 'Idea deleted successfully' });
});
