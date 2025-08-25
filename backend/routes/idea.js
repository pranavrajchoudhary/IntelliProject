const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const ideaController = require('../controllers/ideaController');

// Save an idea
router.post('/', protect, ideaController.saveIdea);

// Get project ideas
router.get('/project/:projectId', protect, ideaController.getProjectIdeas);

// Delete an idea
router.delete('/:ideaId', protect, ideaController.deleteIdea);

module.exports = router;
