const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const analyticsController = require('../controllers/analyticsController');

router.get('/dashboard', protect, analyticsController.getDashboardStats);
router.get('/project/:projectId', protect, analyticsController.getProjectAnalytics);

router.get('/snapshot/latest', protect, analyticsController.getLatestSnapshot);

router.post('/snapshot', protect, analyticsController.saveStatsSnapshot);
router.get('/trends', protect, analyticsController.getHistoricalTrends);

module.exports = router;
