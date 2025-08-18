const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const analyticsController = require('../controllers/analyticsController');

router.get('/dashboard', protect, analyticsController.getDashboardStats);
router.get('/project/:projectId', protect, analyticsController.getProjectAnalytics);

module.exports = router;
