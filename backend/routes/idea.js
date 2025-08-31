const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const ideaController = require('../controllers/ideaController');

router.post('/', protect, ideaController.saveIdea);

router.get('/project/:projectId', protect, ideaController.getProjectIdeas);

router.delete('/:ideaId', protect, ideaController.deleteIdea);

module.exports = router;
