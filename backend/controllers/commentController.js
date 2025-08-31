const Comment = require('../models/Comment');
const Project = require('../models/Project');
const asyncHandler = require('../utils/asyncHandler');

// Get all comments for a project (with replies)
exports.getProjectComments = asyncHandler(async (req, res) => {
  const { projectId } = req.params;

  // Check if user has access to this project
  const project = await Project.findById(projectId);
  if (!project) {
    return res.status(404).json({ message: 'Project not found' });
  }

  // Check if user is a member of the project or owner
  const isOwner = project.owner.toString() === req.user._id.toString();
  const isMember = project.members.some(member => member.toString() === req.user._id.toString());
  
  // Allow access if user is owner, member, or admin
  if (!isOwner && !isMember && req.user.role !== 'admin') {
    console.log('Access denied for user:', req.user._id, 'Project:', projectId);
    console.log('Owner:', project.owner, 'Members:', project.members);
    console.log('Is Owner:', isOwner, 'Is Member:', isMember, 'User Role:', req.user.role);
    return res.status(403).json({ message: 'Access denied' });
  }

  // Get top-level comments (no parent) with their replies
  const comments = await Comment.find({
    project: projectId,
    parentComment: null,
    isDeleted: false
  })
  .populate('author', 'name email')
  .populate({
    path: 'replies',
    match: { isDeleted: false },
    populate: {
      path: 'author',
      select: 'name email'
    },
    options: { sort: { createdAt: 1 } }
  })
  .sort({ createdAt: -1 });

  res.json(comments);
});

// Create a new comment
exports.createComment = asyncHandler(async (req, res) => {
  const { content, parentComment } = req.body;
  const { projectId } = req.params;

  // Check if user has access to this project
  const project = await Project.findById(projectId);
  if (!project) {
    return res.status(404).json({ message: 'Project not found' });
  }

  // Check if user is a member of the project or owner
  const isOwner = project.owner.toString() === req.user._id.toString();
  const isMember = project.members.some(member => member.toString() === req.user._id.toString());
  
  // Allow access if user is owner, member, or admin
  if (!isOwner && !isMember && req.user.role !== 'admin') {
    console.log('Create comment access denied for user:', req.user._id, 'Project:', projectId);
    return res.status(403).json({ message: 'Access denied' });
  }

  // If it's a reply, verify parent comment exists
  if (parentComment) {
    const parentCommentDoc = await Comment.findById(parentComment);
    if (!parentCommentDoc || parentCommentDoc.project.toString() !== projectId) {
      return res.status(404).json({ message: 'Parent comment not found' });
    }
  }

  const comment = await Comment.create({
    content,
    author: req.user._id,
    project: projectId,
    parentComment: parentComment || null
  });

  // If it's a reply, add it to parent's replies array
  if (parentComment) {
    await Comment.findByIdAndUpdate(parentComment, {
      $push: { replies: comment._id }
    });
  }

  // Populate author before sending response
  await comment.populate('author', 'name email');

  res.status(201).json(comment);
});

// Delete a comment
exports.deleteComment = asyncHandler(async (req, res) => {
  const { commentId } = req.params;

  const comment = await Comment.findById(commentId).populate('project');
  if (!comment) {
    return res.status(404).json({ message: 'Comment not found' });
  }

  const project = comment.project;

  // Check if user can delete this comment
  // Only the comment author, project owner, or admins can delete
  const canDelete = 
    comment.author.toString() === req.user._id.toString() || // Comment author
    project.owner.toString() === req.user._id.toString() || // Project owner
    req.user.role === 'admin'; // Admin

  if (!canDelete) {
    return res.status(403).json({ message: 'Not authorized to delete this comment' });
  }

  // Soft delete - mark as deleted instead of removing
  comment.isDeleted = true;
  comment.deletedBy = req.user._id;
  comment.deletedAt = new Date();
  await comment.save();

  // Also soft delete all replies
  if (comment.replies && comment.replies.length > 0) {
    await Comment.updateMany(
      { _id: { $in: comment.replies } },
      { 
        isDeleted: true, 
        deletedBy: req.user._id, 
        deletedAt: new Date() 
      }
    );
  }

  res.json({ message: 'Comment deleted successfully' });
});

// Update a comment
exports.updateComment = asyncHandler(async (req, res) => {
  const { commentId } = req.params;
  const { content } = req.body;

  const comment = await Comment.findById(commentId);
  if (!comment) {
    return res.status(404).json({ message: 'Comment not found' });
  }

  // Only the comment author can edit
  if (comment.author.toString() !== req.user._id.toString()) {
    return res.status(403).json({ message: 'Not authorized to edit this comment' });
  }

  comment.content = content;
  await comment.save();
  await comment.populate('author', 'name email');

  res.json(comment);
});
