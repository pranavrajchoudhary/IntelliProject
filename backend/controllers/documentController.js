const Document = require('../models/Document');
const asyncHandler = require('../utils/asyncHandler');

exports.createDocument = asyncHandler(async (req, res) => {
  const { projectId, title, content } = req.body;
  const doc = await Document.create({ projectId, title, currentContent: content || '', createdBy: req.user._id });
  res.status(201).json(doc);
});

exports.updateDocument = asyncHandler(async (req, res) => {
  const doc = await Document.findById(req.params.id);
  if (!doc) return res.status(404).json({ message: 'Document not found' });
  doc._updatedBy = req.user._id; // used in pre-save hook to save version editor
  doc.currentContent = req.body.currentContent || doc.currentContent;
  await doc.save();
  res.json(doc);
});

exports.getProjectDocs = asyncHandler(async (req, res) => {
  const docs = await Document.find({ projectId: req.params.projectId });
  res.json(docs);
});

exports.getDocument = asyncHandler(async (req, res) => {
  const doc = await Document.findById(req.params.id)
    .populate('createdBy', 'name email')
    .populate('versions.editedBy', 'name email');
  if (!doc) return res.status(404).json({ message: 'Document not found' });
  res.json(doc);
});