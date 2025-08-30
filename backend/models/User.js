const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['admin','pm','member','guest'], default: 'member' },
  status: { 
    type: String, 
    enum: ['pending', 'approved', 'rejected', 'suspended'], 
    default: 'approved'
  },
  suspended: { type: Boolean, default: false },
  approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  approvedAt: { type: Date },
  rejectionReason: { type: String },
  originalRole: { type: String, enum: ['admin','pm','member','guest'] },
  lastLogin: { type: Date },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

UserSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

UserSchema.methods.matchPassword = async function(entered) {
  
  return await bcrypt.compare(entered, this.password);
};

module.exports = mongoose.model('User', UserSchema);
