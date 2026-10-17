const fs = require('fs/promises');
const path = require('path');

/**
 * Custom Persistent Vector Store implementation.
 * Stores document chunks and their associated 384-dimensional embeddings.
 * Features:
 * - Cosine Similarity nearest-neighbor search
 * - Document-scoped filtering (querying a specific document vs all)
 * - Minimum similarity thresholding to avoid retrieving irrelevant context
 * - Document deletion and chunk cleanup
 * - Disk persistence across server restarts
 */
class VectorStore {
  constructor(storagePath = 'data/vectors.json') {
    this.storagePath = path.resolve(__dirname, '..', storagePath);
    this.vectors = []; // Array of { id, text, metadata: { source, docId, idx }, embedding }
  }

  async ensureDirectory() {
    const dir = path.dirname(this.storagePath);
    try {
      await fs.mkdir(dir, { recursive: true });
    } catch {
      // directory exists or created
    }
  }

  async load() {
    await this.ensureDirectory();
    try {
      const data = await fs.readFile(this.storagePath, 'utf8');
      this.vectors = JSON.parse(data);
      console.log(`[VectorStore] Loaded ${this.vectors.length} vector chunks from ${this.storagePath}.`);
    } catch (err) {
      if (err.code === 'ENOENT') {
        // Also check if legacy root vectors.json exists to migrate
        const legacyPath = path.resolve(__dirname, '..', 'vectors.json');
        try {
          const legacyData = await fs.readFile(legacyPath, 'utf8');
          this.vectors = JSON.parse(legacyData);
          await this.save();
          console.log(`[VectorStore] Migrated ${this.vectors.length} vectors from legacy storage.`);
          return;
        } catch {
          // No legacy storage either
        }
        console.log('[VectorStore] No existing storage found. Initializing fresh vector index.');
        this.vectors = [];
      } else {
        console.error('[VectorStore] Error loading vectors:', err.message);
        this.vectors = [];
      }
    }
  }

  async save() {
    await this.ensureDirectory();
    try {
      await fs.writeFile(this.storagePath, JSON.stringify(this.vectors, null, 2), 'utf8');
    } catch (err) {
      console.error('[VectorStore] Error saving vectors:', err.message);
    }
  }

  /**
   * Adds new vectors to the store, replacing any existing vectors for the same source/docId.
   * @param {Array<{ id: string, text: string, metadata: object, embedding: number[] }>} items 
   */
  async addVectors(items) {
    if (!items || items.length === 0) return;
    
    // If incoming chunks have a source, remove prior chunks from same source to prevent duplicates
    const incomingSources = new Set(items.map(it => it.metadata?.source).filter(Boolean));
    if (incomingSources.size > 0) {
      this.vectors = this.vectors.filter(v => !incomingSources.has(v.metadata?.source));
    }

    this.vectors.push(...items);
    await this.save();
    console.log(`[VectorStore] Indexed ${items.length} new chunks. Total active chunks: ${this.vectors.length}.`);
  }

  /**
   * Removes all vector chunks associated with a specific document source or docId.
   */
  async removeBySource(source) {
    const initialCount = this.vectors.length;
    this.vectors = this.vectors.filter(v => v.metadata?.source !== source && v.metadata?.docId !== source);
    const removed = initialCount - this.vectors.length;
    if (removed > 0) {
      await this.save();
      console.log(`[VectorStore] Removed ${removed} chunks for document/id: ${source}.`);
    }
    return removed;
  }

  async removeByDocId(docId) {
    return this.removeBySource(docId);
  }

  /**
   * Calculates cosine similarity between two numerical vectors.
   * Cosine Similarity = (A . B) / (||A|| * ||B||)
   */
  cosineSimilarity(vecA, vecB) {
    if (!vecA || !vecB || vecA.length !== vecB.length) return 0;
    let dotProduct = 0.0;
    let normA = 0.0;
    let normB = 0.0;
    for (let i = 0; i < vecA.length; i++) {
      dotProduct += vecA[i] * vecB[i];
      normA += vecA[i] * vecA[i];
      normB += vecB[i] * vecB[i];
    }
    if (normA === 0 || normB === 0) return 0;
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }

  /**
   * Searches the vector store for top K most relevant chunks.
   * Optionally filtered by document name/docId.
   * Enforces minimum similarity threshold so unrelated questions don't hallucinate.
   * @param {number[]} queryEmbedding 
   * @param {object} options
   * @param {number} options.topK
   * @param {string|null} options.filterSource
   * @param {number} options.minScore
   */
  async search(queryEmbedding, { topK = 4, filterSource = null, minScore = 0.20 } = {}) {
    if (!this.vectors || this.vectors.length === 0) return [];
    if (!queryEmbedding || queryEmbedding.length === 0) return [];

    let pool = this.vectors;
    if (filterSource) {
      pool = this.vectors.filter(v => 
        v.metadata?.source === filterSource || 
        v.metadata?.docId === filterSource ||
        (v.metadata?.source && v.metadata.source.toLowerCase() === filterSource.toLowerCase())
      );
      if (pool.length === 0) {
        console.log(`[VectorStore] No vectors found specifically matching filter: ${filterSource}`);
        return [];
      }
    }

    const scored = pool.map(v => {
      const score = this.cosineSimilarity(queryEmbedding, v.embedding);
      return {
        id: v.id,
        text: v.text,
        metadata: v.metadata,
        score
      };
    });

    // Sort descending by similarity
    scored.sort((a, b) => b.score - a.score);

    // Apply minimum threshold
    const filtered = scored.filter(item => item.score >= minScore);

    return filtered.slice(0, topK);
  }

  getChunkCount() {
    return this.vectors.length;
  }

  getAllSources() {
    return Array.from(new Set(this.vectors.map(v => v.metadata?.source).filter(Boolean)));
  }
}

module.exports = VectorStore;
