const mongoose = require('mongoose');

const ActivitySchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
  action: { type: String, required: true },
  description: { type: String, required: true },
  entityType: { type: String, enum: ['task', 'project', 'document', 'member'], required: true },
  entityId: { type: mongoose.Schema.Types.ObjectId },
  metadata: { type: Object, default: {} }
}, { timestamps: true });

module.exports = mongoose.model('Activity', ActivitySchema);
