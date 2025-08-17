const mongoose = require('mongoose');

const IdeaSchema = new mongoose.Schema({
  text: { type: String, required: true }, 
  description: { type: String }, 
  category: { type: String },
  priority: { type: String, enum: ['High', 'Medium', 'Low'] }, 
  feasibility: { type: Number, min: 1, max: 10 }, 
  project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  tags: [String], 
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Idea', IdeaSchema);
