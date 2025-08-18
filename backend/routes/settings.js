const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const settingsController = require('../controllers/settingsController');

router.get('/', protect, settingsController.getUserSettings);
router.put('/', protect, settingsController.updateUserSettings);
router.put('/password', protect, settingsController.changePassword);
router.delete('/account', protect, settingsController.deleteAccount);

module.exports = router;
