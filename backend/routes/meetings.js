const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { authorizeRoles } = require('../middleware/authorize');
const meetingController = require('../controllers/meetingController');

router.post('/', protect, authorizeRoles('admin', 'pm'), meetingController.createMeetingRoom);

router.get('/active', protect, meetingController.getActiveMeetingRooms);

router.get('/history', protect, meetingController.getMeetingHistory);

router.post('/:roomId/join', protect, meetingController.joinMeetingRoom);

router.post('/:roomId/leave', protect, meetingController.leaveMeetingRoom);

router.post('/:roomId/end', protect, meetingController.endMeetingRoom);

router.put('/:roomId/settings', protect, meetingController.updateMeetingSettings);

router.put('/:roomId/participants/:participantId/mute', protect, meetingController.muteParticipant);

router.post('/:roomId/mute-all', protect, meetingController.muteAllParticipants);

router.post('/:roomId/unmute-all', protect, meetingController.unmuteAllParticipants);

router.post('/:roomId/participants/:participantId/kick', protect, meetingController.kickParticipant);

router.put('/:roomId/whiteboard-access', protect, meetingController.updateWhiteboardAccess);

router.get('/upcoming', protect, meetingController.getUpcomingMeetingRooms);
router.get('/active',  protect, meetingController.getActiveMeetingRooms);
router.delete('/:roomId/cancel', protect, meetingController.cancelMeetingRoom);

router.get('/turn-credentials', protect, meetingController.getTurnCredentials);


module.exports = router;