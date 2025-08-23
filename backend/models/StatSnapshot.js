const mongoose = require('mongoose');

const StatSnapshotSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  stats: {
    totalProjects: { type: Number, required: true },
    totalTasks: { type: Number, required: true },
    completedTasks: { type: Number, required: true },
    teamMembers: { type: Number, required: true }
  },
  trends: {
    projectsChange: { type: Number, default: 0 },
    projectsPercentage: { type: Number, default: 0 },
    tasksChange: { type: Number, default: 0 },
    tasksPercentage: { type: Number, default: 0 },
    completedChange: { type: Number, default: 0 },
    completedPercentage: { type: Number, default: 0 },
    membersChange: { type: Number, default: 0 },
    membersPercentage: { type: Number, default: 0 }
  }
}, {
  timestamps: true
});

// Compound index for efficient querying per user
StatSnapshotSchema.index({ user: 1, date: -1 });

// Unique constraint - one snapshot per user per day
StatSnapshotSchema.index({ user: 1, date: 1 }, { unique: true });

// TTL index - Delete snapshots older than 90 days
StatSnapshotSchema.index({ createdAt: 1 }, { expireAfterSeconds: 90 * 24 * 60 * 60 });

module.exports = mongoose.model('StatSnapshot', StatSnapshotSchema);
