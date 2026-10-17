const mongoose = require('mongoose');

const chatMessageSchema = new mongoose.Schema({
  role: { type: String, enum: ['user', 'bot'], required: true },
  text: { type: String, required: true },
  sources: { type: Array, default: [] },
  mode: { type: String, enum: ['general', 'exam'], default: 'general', index: true },
  docId: { type: String, default: null },
  timestamp: { type: Date, default: Date.now, index: true }
});

module.exports = mongoose.model('ChatMessage', chatMessageSchema);
