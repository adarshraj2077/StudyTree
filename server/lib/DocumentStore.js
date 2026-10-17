const fs = require('fs/promises');
const path = require('path');
const Document = require('../models/Document');
const { isDBConnected } = require('./db');

/**
 * Resilient Document Store that bridges MongoDB and local disk persistence.
 * When MongoDB is running, it stores and queries MongoDB.
 * If MongoDB is offline, it automatically persists to server/data/documents.json.
 */
class DocumentStore {
  constructor(storagePath = 'data/documents.json') {
    this.storagePath = path.resolve(__dirname, '..', storagePath);
    this.documents = []; // Array of document objects
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
      this.documents = JSON.parse(data);
      console.log(`[DocumentStore] Loaded ${this.documents.length} documents from local storage.`);
    } catch (err) {
      if (err.code === 'ENOENT') {
        this.documents = [];
        await this.save();
      } else {
        console.error('[DocumentStore] Error reading local document store:', err.message);
        this.documents = [];
      }
    }

    // If MongoDB is connected, sync documents
    if (isDBConnected()) {
      try {
        const mongoDocs = await Document.find().lean();
        if (mongoDocs.length > 0) {
          // Merge with local documents
          const existingIds = new Set(this.documents.map(d => d.docId));
          for (const mDoc of mongoDocs) {
            if (!existingIds.has(mDoc.docId)) {
              this.documents.push({
                id: mDoc.docId,
                docId: mDoc.docId,
                name: mDoc.filename,
                filename: mDoc.filename,
                summary: mDoc.summary,
                keyPoints: mDoc.keyPoints || [],
                fileSize: mDoc.fileSize || 0,
                chunksCount: mDoc.chunksCount || 0,
                date: new Date(mDoc.uploadDate).toLocaleDateString(),
                status: mDoc.status || 'ready'
              });
            }
          }
          await this.save();
          console.log(`[DocumentStore] Synchronized with MongoDB (${mongoDocs.length} records).`);
        }
      } catch (err) {
        console.warn('[DocumentStore] Failed to sync with MongoDB:', err.message);
      }
    }
  }

  async save() {
    await this.ensureDirectory();
    try {
      await fs.writeFile(this.storagePath, JSON.stringify(this.documents, null, 2), 'utf8');
    } catch (err) {
      console.error('[DocumentStore] Error saving documents to disk:', err.message);
    }
  }

  async addDocument(docData) {
    // Check if document already exists with same filename or id, replace it
    this.documents = this.documents.filter(d => d.docId !== docData.docId && d.name !== docData.name);
    this.documents.unshift(docData);
    await this.save();

    // Persist to MongoDB if active
    if (isDBConnected()) {
      try {
        await Document.findOneAndUpdate(
          { docId: docData.docId },
          {
            docId: docData.docId,
            filename: docData.name,
            fileSize: docData.fileSize || 0,
            chunksCount: docData.chunksCount || 0,
            summary: docData.summary || '',
            keyPoints: docData.keyPoints || [],
            status: docData.status || 'ready',
            uploadDate: new Date()
          },
          { upsert: true, new: true }
        );
        console.log(`[DocumentStore] Persisted document metadata to MongoDB: ${docData.name}`);
      } catch (err) {
        console.warn(`[DocumentStore] MongoDB save error for ${docData.name}:`, err.message);
      }
    }

    return docData;
  }

  getAll() {
    return this.documents;
  }

  getById(id) {
    return this.documents.find(d => d.id === id || d.docId === id || d.name === id);
  }

  async deleteDocument(id) {
    const docToDelete = this.getById(id);
    const initialCount = this.documents.length;
    this.documents = this.documents.filter(d => d.id !== id && d.docId !== id && d.name !== id);
    const removed = initialCount > this.documents.length;

    if (removed) {
      await this.save();
      console.log(`[DocumentStore] Deleted document: ${id}`);
    }

    if (isDBConnected()) {
      try {
        await Document.deleteOne({ $or: [{ docId: id }, { filename: id }] });
        console.log(`[DocumentStore] Deleted document from MongoDB: ${id}`);
      } catch (err) {
        console.warn('[DocumentStore] MongoDB delete error:', err.message);
      }
    }

    return { removed, doc: docToDelete };
  }
}

module.exports = DocumentStore;
