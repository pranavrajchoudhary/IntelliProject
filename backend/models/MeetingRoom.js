const mongoose = require('mongoose');

const MeetingRoomSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
    host: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

    status: {
      type: String,
      enum: ['scheduled', 'active', 'ended'],
      default: 'active',
    },
    scheduledStartTime: { type: Date },

    participants: [
      {
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        joinedAt: { type: Date, default: Date.now },
        leftAt: { type: Date },
        isMuted: { type: Boolean, default: false },
        isConnected: { type: Boolean, default: true },
        mutedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        mutedAt: { type: Date },
        canUnmute: { type: Boolean, default: true },
      },
    ],

    settings: {
      allowAllToSpeak: { type: Boolean, default: true },
      muteAllMembers: { type: Boolean, default: false },
      whiteboardAccess: {
        type: String,
        enum: ['all', 'host-only', 'specific', 'disabled'],
        default: 'all',
      },
      whiteboardAllowedUsers: { type: [String], default: [] },
      recordSession: { type: Boolean, default: false },
      allowParticipantMute: { type: Boolean, default: true },
    },

    // Note: The `whiteboardData` field is not used for real-time syncing in this
    // implementation. It is included here for potential future use, such as saving
    // a final snapshot of the whiteboard to the database after the meeting ends.
    whiteboardData: { type: Map, of: Object },
    lastWhiteboardUpdate: { type: Date },

    startedAt: { type: Date, default: Date.now },
    endedAt: { type: Date },
    duration: { type: Number, default: 0 }, // in minutes
  },
  { timestamps: true }
);

// Index for efficient queries
MeetingRoomSchema.index({ project: 1, status: 1 });
MeetingRoomSchema.index({ host: 1, status: 1 });
MeetingRoomSchema.index({ status: 1, scheduledStartTime: 1 });

module.exports = mongoose.model('MeetingRoom', MeetingRoomSchema);