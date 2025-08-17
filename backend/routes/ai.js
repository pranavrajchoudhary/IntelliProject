const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { generateIdeas } = require('../controllers/aiController');

router.post('/generate-ideas', protect, generateIdeas);

module.exports = router;
