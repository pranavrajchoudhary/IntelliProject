const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const commentController = require('../controllers/commentController');

// All comment routes require authentication
router.use(protect);

// Get all comments for a project
router.get('/project/:projectId', commentController.getProjectComments);

// Create a new comment
router.post('/project/:projectId', commentController.createComment);

// Update a comment
router.put('/:commentId', commentController.updateComment);

// Delete a comment
router.delete('/:commentId', commentController.deleteComment);

module.exports = router;
