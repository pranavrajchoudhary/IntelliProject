const Message = require('../models/Message');
const Project = require('../models/Project');
const asyncHandler = require('../utils/asyncHandler');

exports.getProjectMessages = asyncHandler(async (req, res) => {
  const messages = await Message.find({ project: req.params.projectId })
    .populate('sender', 'name email')
    .sort({ createdAt: 1 })
    .limit(100);
  res.json(messages);
});

exports.createMessage = asyncHandler(async (req, res) => {
  const { content, projectId, type = 'text' } = req.body;
  
  const message = await Message.create({
    content,
    sender: req.user._id,
    project: projectId,
    type
  });

  const populatedMessage = await Message.findById(message._id)
    .populate('sender', 'name email');
  
  res.status(201).json(populatedMessage);
});

exports.markAsRead = asyncHandler(async (req, res) => {
  const message = await Message.findById(req.params.messageId);
  
  if (!message) {
    return res.status(404).json({ message: 'Message not found' });
  }

  const readEntry = message.isRead.find(r => r.user.equals(req.user._id));
  if (!readEntry) {
    message.isRead.push({ user: req.user._id });
    await message.save();
  }

  res.json({ message: 'Marked as read' });
});

exports.getUserMessages = asyncHandler(async (req, res) => {
  const messages = await Message.find({
    project: { $in: await Project.find({ members: req.user._id }).select('_id') }
  })
    .populate('sender', 'name email')
    .populate('project', 'title')
    .sort({ createdAt: -1 })
    .limit(50);
  
  res.json(messages);
});
