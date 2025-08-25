const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { authorizeRoles } = require('../middleware/authorize');
const meetingController = require('../controllers/meetingController');

// Create meeting room (PM and Admin only)
router.post('/', protect, authorizeRoles('admin', 'pm'), meetingController.createMeetingRoom);

// Get active meeting rooms
router.get('/active', protect, meetingController.getActiveMeetingRooms);

// Get meeting history
router.get('/history', protect, meetingController.getMeetingHistory);

// Join meeting room
router.post('/:roomId/join', protect, meetingController.joinMeetingRoom);

// Leave meeting room
router.post('/:roomId/leave', protect, meetingController.leaveMeetingRoom);

// End meeting room (Host or Admin only)
router.post('/:roomId/end', protect, meetingController.endMeetingRoom);

// Update meeting settings (Host or Admin only)
router.put('/:roomId/settings', protect, meetingController.updateMeetingSettings);

// Mute participant (Host or Admin only)
router.put('/:roomId/participants/:participantId/mute', protect, meetingController.muteParticipant);

// Mute all participants (Host or Admin only)
router.post('/:roomId/mute-all', protect, meetingController.muteAllParticipants);

// Unmute all participants (Host or Admin only)
router.post('/:roomId/unmute-all', protect, meetingController.unmuteAllParticipants);

router.post('/:roomId/participants/:participantId/kick', protect, meetingController.kickParticipant);

// Update whiteboard access (Host or Admin only)
router.put('/:roomId/whiteboard-access', protect, meetingController.updateWhiteboardAccess);

router.get('/upcoming', protect, meetingController.getUpcomingMeetingRooms);
router.get('/active',  protect, meetingController.getActiveMeetingRooms);
// Cancel scheduled meeting (Host or Admin only)
router.delete('/:roomId/cancel', protect, meetingController.cancelMeetingRoom);

router.get('/turn-credentials', protect, meetingController.getTurnCredentials);


module.exports = router;