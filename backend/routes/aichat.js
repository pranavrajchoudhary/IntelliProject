const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { aiRateLimit, dailyAILimit } = require('../middleware/aiRateLimit');
const { chatWithAI, projectChatWithAI, generateProjectIdeas } = require('../controllers/aiChatController');

router.use(aiRateLimit);
router.use(dailyAILimit);

router.post('/chat', protect, chatWithAI);
router.post('/project-chat', protect, projectChatWithAI);
router.post('/project-ideas', protect, generateProjectIdeas);

module.exports = router;
