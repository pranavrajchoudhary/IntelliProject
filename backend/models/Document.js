const mongoose = require('mongoose');

const DocumentSchema = new mongoose.Schema({
  projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
  title: { type: String, required: true },
  currentContent: { type: String, default: '' },
  versions: [{
    content: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
    editedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  }],
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true });

DocumentSchema.pre('save', function(next) {
  if (this.isModified('currentContent') && this.currentContent !== undefined) {
    this.versions.push({
      content: this.currentContent,
      editedBy: this._updatedBy || this.createdBy
    });
  }
  next();
});

module.exports = mongoose.model('Document', DocumentSchema);
