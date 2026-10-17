const fs = require('fs/promises');
const path = require('path');
const ChatMessage = require('../models/ChatMessage');
const { isDBConnected } = require('./db');

/**
 * Resilient Chat Store bridging MongoDB and local disk JSON persistence.
 * When MongoDB is active, messages are stored in MongoDB.
 * When offline, messages persist to server/data/chat_history.json.
 */
class ChatStore {
  constructor(storagePath = 'data/chat_history.json') {
    this.storagePath = path.resolve(__dirname, '..', storagePath);
    this.messages = [];
  }

  async ensureDirectory() {
    const dir = path.dirname(this.storagePath);
    try {
      await fs.mkdir(dir, { recursive: true });
    } catch {
      // directory exists
    }
  }

  async init() {
    await this.ensureDirectory();
    try {
      const data = await fs.readFile(this.storagePath, 'utf8');
      this.messages = JSON.parse(data);
      console.log(`[ChatStore] Loaded ${this.messages.length} messages from local storage.`);
    } catch (err) {
      if (err.code === 'ENOENT') {
        this.messages = [];
        await this.save();
      } else {
        console.error('[ChatStore] Error reading chat store:', err.message);
        this.messages = [];
      }
    }

    if (isDBConnected()) {
      try {
        const mongoMessages = await ChatMessage.find().sort({ timestamp: 1 }).lean();
        if (mongoMessages.length > 0) {
          this.messages = mongoMessages.map(m => ({
            id: m._id.toString(),
            role: m.role,
            text: m.text,
            sources: m.sources || [],
            mode: m.mode || 'general',
            docId: m.docId || null,
            timestamp: m.timestamp
          }));
          await this.save();
          console.log(`[ChatStore] Synchronized ${mongoMessages.length} messages from MongoDB.`);
        }
      } catch (err) {
        console.warn('[ChatStore] Failed to sync messages from MongoDB:', err.message);
      }
    }
  }

  async save() {
    await this.ensureDirectory();
    try {
      await fs.writeFile(this.storagePath, JSON.stringify(this.messages, null, 2), 'utf8');
    } catch (err) {
      console.error('[ChatStore] Error saving chat history to disk:', err.message);
    }
  }

  async addMessage({ role, text, sources = [], mode = 'general', docId = null }) {
    const msgObj = {
      id: Date.now().toString() + '-' + Math.random().toString(36).substring(2, 7),
      role,
      text,
      sources,
      mode: mode || 'general',
      docId: docId || null,
      timestamp: new Date().toISOString()
    };

    this.messages.push(msgObj);
    await this.save();

    if (isDBConnected()) {
      try {
        await ChatMessage.create({
          role: msgObj.role,
          text: msgObj.text,
          sources: msgObj.sources,
          mode: msgObj.mode,
          docId: msgObj.docId,
          timestamp: new Date(msgObj.timestamp)
        });
        console.log(`[ChatStore] Persisted chat message to MongoDB (${msgObj.role}, mode: ${msgObj.mode})`);
      } catch (err) {
        console.warn('[ChatStore] MongoDB chat save error:', err.message);
      }
    }

    return msgObj;
  }

  getHistory(mode = 'general', docId = null) {
    return this.messages.filter(m => {
      const modeMatch = (m.mode || 'general') === mode;
      if (!modeMatch) return false;
      if (docId && docId !== 'general') {
        return m.docId === docId;
      }
      return !m.docId || m.docId === 'general';
    });
  }

  async clearHistory(mode = 'general', docId = null) {
    this.messages = this.messages.filter(m => {
      const modeMatch = (m.mode || 'general') === mode;
      if (!modeMatch) return true;
      if (docId && docId !== 'general') {
        return m.docId !== docId;
      }
      return m.docId && m.docId !== 'general';
    });
    await this.save();

    if (isDBConnected()) {
      try {
        const query = { mode };
        if (docId && docId !== 'general') {
          query.docId = docId;
        } else {
          query.$or = [{ docId: null }, { docId: 'general' }, { docId: { $exists: false } }];
        }
        await ChatMessage.deleteMany(query);
        console.log(`[ChatStore] Cleared chat history in MongoDB for mode: ${mode}, docId: ${docId || 'general'}`);
      } catch (err) {
        console.warn('[ChatStore] MongoDB clear history error:', err.message);
      }
    }

    return { cleared: true, mode, docId };
  }
}

module.exports = ChatStore;
