const mongoose = require('mongoose');

const documentSchema = new mongoose.Schema({
  filename: { type: String, required: true },
  content: { type: Buffer, required: true }, // Store standard PDF binary
  uploadDate: { type: Date, default: Date.now },
  chunksCount: { type: Number, default: 0 }
});

module.exports = mongoose.model('Document', documentSchema);
