const mongoose = require('mongoose');

const TaskSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: String,
  status: { type: String, enum: ['todo','inprogress','done'], default: 'todo' },
  project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
  assignee: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  position: { type: Number, default: 0 }, // for ordering on Kanban
  dueDate: Date
}, { timestamps: true });

module.exports = mongoose.model('Task', TaskSchema);
