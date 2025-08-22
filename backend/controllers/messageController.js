const Message = require('../models/Message');
const Project = require('../models/Project');
const asyncHandler = require('../utils/asyncHandler');

exports.getProjectMessages = asyncHandler(async (req, res) => {
  const messages = await Message.find({ project: req.params.projectId })
    .populate('sender', 'name email')
    .populate('readBy.user', 'name')
    .sort({ createdAt: 1 })
    .limit(100);

  // Mark messages as delivered for the requesting user
  await Message.updateMany(
    { 
      project: req.params.projectId,
      sender: { $ne: req.user._id },
      status: 'sent'
    },
    { status: 'delivered' }
  );

  res.json(messages);
});

exports.createMessage = asyncHandler(async (req, res) => {
  const { content, projectId, type = 'text', audioUrl, audioDuration } = req.body;

  const message = await Message.create({
    content,
    sender: req.user._id,
    project: projectId,
    type,
    audioUrl,
    audioDuration,
    status: 'sent'
  });

  const populatedMessage = await Message.findById(message._id)
    .populate('sender', 'name email')
    .populate('readBy.user', 'name');

  // Emit to project room via socket
  const io = req.app.get('io');
  if (io) {
    io.to(projectId).emit('newMessage', populatedMessage);
    io.to(projectId).emit('messageDelivered', { messageId: message._id });
  }

  res.status(201).json(populatedMessage);
});

exports.markAsRead = asyncHandler(async (req, res) => {
  const message = await Message.findById(req.params.messageId);
  
  if (!message) {
    return res.status(404).json({ message: 'Message not found' });
  }

  // Check if user already read this message
  const alreadyRead = message.readBy.find(r => r.user.equals(req.user._id));
  
  if (!alreadyRead) {
    message.readBy.push({ user: req.user._id });
    
    // Update status to read if this user is reading it
    if (message.sender.toString() !== req.user._id.toString()) {
      message.status = 'read';
    }
    
    await message.save();

    // Emit read receipt to sender
    const io = req.app.get('io');
    if (io) {
      io.to(message.project.toString()).emit('messageRead', { 
        messageId: message._id,
        readBy: req.user._id 
      });
    }
  }

  res.json({ message: 'Marked as read' });
});

// Get unread message count per project for user
exports.getUnreadCounts = asyncHandler(async (req, res) => {
  const userProjects = await Project.find({ members: req.user._id }).select('_id title');
  
  const unreadCounts = await Promise.all(
    userProjects.map(async (project) => {
      const count = await Message.countDocuments({
        project: project._id,
        sender: { $ne: req.user._id },
        readBy: { $not: { $elemMatch: { user: req.user._id } } }
      });
      
      return {
        projectId: project._id,
        projectTitle: project.title,
        unreadCount: count
      };
    })
  );

  res.json(unreadCounts);
});

exports.getUserMessages = asyncHandler(async (req, res) => {
  const messages = await Message.find({
    project: { $in: await Project.find({ members: req.user._id }).select('_id') }
  })
    .populate('sender', 'name email')
    .populate('project', 'title')
    .populate('readBy.user', 'name')
    .sort({ createdAt: -1 })
    .limit(50);

  res.json(messages);
});
