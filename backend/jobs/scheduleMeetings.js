const cron = require('node-cron');
const MeetingRoom = require('../models/MeetingRoom');

module.exports = function scheduleMeetings(io) {
  // every minute
  cron.schedule('* * * * *', async () => {
    const now = new Date();
    const ready = await MeetingRoom.updateMany(
      { status: 'scheduled', scheduledStartTime: { $lte: now } },
      { $set: { status: 'active', startedAt: now } }
    );

    if (ready.modifiedCount) {
      const startedRooms = await MeetingRoom.find({
        status: 'active',
        startedAt: { $gte: new Date(now - 60_000) },
      })
        .populate('project', 'title')
        .populate('host', 'name');

      startedRooms.forEach(room => {
        io.to(`project-${room.project._id}`).emit('meetingRoomStarted', room);
      });
    }
  });
};
