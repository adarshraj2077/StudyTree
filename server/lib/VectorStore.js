const fs = require('fs/promises');
const path = require('path');

/**
 * A custom Vector Store implementation.
 * Stores document chunks and their associated embeddings.
 * Supports finding nearest neighbors using Cosine Similarity.
 */
class VectorStore {
  constructor(storagePath = 'vectors.json') {
    this.storagePath = path.resolve(__dirname, '..', storagePath);
    this.vectors = []; // Array of { id, text, metadata, embedding }
  }

  async load() {
    try {
      const data = await fs.readFile(this.storagePath, 'utf8');
      this.vectors = JSON.parse(data);
      console.log(`[VectorStore] Loaded ${this.vectors.length} vectors from storage.`);
    } catch (err) {
      if (err.code === 'ENOENT') {
        console.log('[VectorStore] No existing storage found. Starting fresh.');
        this.vectors = [];
      } else {
        console.error('[VectorStore] Error loading vectors:', err);
      }
    }
  }

  async save() {
    try {
      await fs.writeFile(this.storagePath, JSON.stringify(this.vectors, null, 2), 'utf8');
    } catch (err) {
      console.error('[VectorStore] Error saving vectors:', err);
    }
  }

  /**
   * Adds new vectors to the store.
   * @param {Array<{ id: string, text: string, metadata: object, embedding: number[] }>} items 
   */
  async addVectors(items) {
    this.vectors.push(...items);
    await this.save();
    console.log(`[VectorStore] Added ${items.length} new vectors.`);
  }

  /**
   * Calculates cosine similarity between two vectors.
   */
  cosineSimilarity(vecA, vecB) {
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
   * Searches the vector store for the top K most similar chunks.
   * @param {number[]} queryEmbedding 
   * @param {number} topK 
   */
  async search(queryEmbedding, topK = 3) {
    if (this.vectors.length === 0) return [];
    
    // Calculate similarities
    const results = this.vectors.map(v => {
      const score = this.cosineSimilarity(queryEmbedding, v.embedding);
      return { ...v, score };
    });

    // Sort descending by score
    results.sort((a, b) => b.score - a.score);
    
    return results.slice(0, topK);
  }
}

module.exports = VectorStore;
