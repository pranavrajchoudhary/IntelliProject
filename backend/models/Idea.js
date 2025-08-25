const mongoose = require('mongoose');

const IdeaSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  category: { type: String, default: 'General' },
  priority: { type: String, enum: ['High', 'Medium', 'Low'], default: 'Medium' },
  feasibility: { type: Number, min: 1, max: 10, default: 5 },
  tags: [String],
  prompt: { type: String, required: true }, // The prompt used to generate this idea
  project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  createdAt: { type: Date, default: Date.now }
});

// Index for efficient queries
IdeaSchema.index({ project: 1, createdAt: -1 });
IdeaSchema.index({ createdBy: 1 });

module.exports = mongoose.model('Idea', IdeaSchema);
