const mongoose = require('mongoose');

const MessageSchema = new mongoose.Schema({
  content: { type: String, required: true },
  sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
  type: { type: String, enum: ['text', 'file', 'system', 'voice'], default: 'text' },
  
  // Add delivery status
  status: { 
    type: String, 
    enum: ['sending', 'sent', 'delivered', 'read'], 
    default: 'sent' 
  },
  
  // For voice messages
  audioUrl: { type: String },
  audioDuration: { type: Number }, // in seconds
  
  fileUrl: { type: String },
  fileName: { type: String },
  
  // Track which users have read the message
  readBy: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    readAt: { type: Date, default: Date.now }
  }]
}, { timestamps: true });

module.exports = mongoose.model('Message', MessageSchema);
