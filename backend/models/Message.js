const mongoose = require('mongoose');

const MessageSchema = new mongoose.Schema({
  content: { type: String, required: true },
  sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
  type: { type: String, enum: ['text', 'file', 'system', 'voice'], default: 'text' },
  status: {
    type: String,
    enum: ['sending', 'sent', 'delivered', 'read'],
    default: 'sent'
  },
  tempId: { type: String }, // Add this for matching temp messages
  audioUrl: { type: String },
  audioDuration: { type: Number },
  fileUrl: { type: String },
  fileName: { type: String },
  readBy: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    readAt: { type: Date, default: Date.now }
  }]
}, { timestamps: true });

// ADD THIS LINE - This was missing!
module.exports = mongoose.model('Message', MessageSchema);
