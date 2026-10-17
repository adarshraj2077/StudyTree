const mongoose = require('mongoose');

const documentSchema = new mongoose.Schema({
  docId: { type: String, required: true, unique: true, index: true },
  filename: { type: String, required: true },
  fileSize: { type: Number, default: 0 },
  uploadDate: { type: Date, default: Date.now },
  chunksCount: { type: Number, default: 0 },
  summary: { type: String, default: '' },
  keyPoints: { type: [String], default: [] },
  status: { type: String, enum: ['ready', 'processing', 'error'], default: 'ready' }
});

module.exports = mongoose.model('Document', documentSchema);
