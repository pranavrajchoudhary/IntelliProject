const Message = require('../models/Message');
const Project = require('../models/Project');
const asyncHandler = require('../utils/asyncHandler');

exports.getProjectMessages = asyncHandler(async (req, res) => {
  const { excludeVoice } = req.query;
  
  const filter = { project: req.params.projectId };
  
  if (excludeVoice === 'true') {
    filter.type = { $ne: 'voice' };
  }
  
  const messages = await Message.find(filter)
    .populate('sender', 'name email')
    .populate('readBy.user', 'name')
    .sort({ createdAt: 1 })
    .limit(100);

  await Message.updateMany(
    { 
      project: req.params.projectId,
      sender: { $ne: req.user._id },
      status: 'sent'
    },
    { status: 'delivered' }
  );

  const messagesWithCorrectStatus = messages.map(message => {
    if (message.sender._id.toString() === req.user._id.toString()) {
      if (message.readBy && message.readBy.length > 0) {
        const hasBeenReadByOthers = message.readBy.some(read => 
          read.user.toString() !== req.user._id.toString()
        );
        message.status = hasBeenReadByOthers ? 'read' : 'delivered';
      } else {
        message.status = message.status === 'sent' ? 'delivered' : message.status;
      }
    }
    return message;
  });

  res.json(messagesWithCorrectStatus);
});

exports.createMessage = asyncHandler(async (req, res) => {
  const { content, projectId, type = 'text', audioUrl, audioDuration, tempId } = req.body;

  const message = await Message.create({
    content,
    sender: req.user._id,
    project: projectId,
    type,
    audioUrl,
    audioDuration,
    status: 'sent',
    tempId
  });

  const populatedMessage = await Message.findById(message._id)
    .populate('sender', 'name email')
    .populate('readBy.user', 'name');

  const responseMessage = {
    ...populatedMessage.toObject(),
    tempId
  };
  const io = req.app.get('io');
  if (io) {
    io.to(projectId).emit('newMessage', responseMessage);
    io.to(projectId).emit('messageDelivered', { 
      messageId: message._id, 
      tempId 
    });
  }

  res.status(201).json(responseMessage);
});


exports.markAsRead = asyncHandler(async (req, res) => {
  const message = await Message.findById(req.params.messageId);
  
  if (!message) {
    return res.status(404).json({ message: 'Message not found' });
  }

  const alreadyRead = message.readBy.find(r => r.user.equals(req.user._id));
  
  if (!alreadyRead) {
    message.readBy.push({ user: req.user._id });
    
    if (message.sender.toString() !== req.user._id.toString()) {
      message.status = 'read';
    }
    
    await message.save();

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
