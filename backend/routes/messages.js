const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const messageController = require('../controllers/messageController');

router.get('/project/:projectId', protect, messageController.getProjectMessages);
router.post('/', protect, messageController.createMessage);
router.put('/:messageId/read', protect, messageController.markAsRead);
router.get('/user', protect, messageController.getUserMessages);

module.exports = router;
