const axios = require('axios');

/**
 * EmbeddingModel – generates dense embeddings via Google Gemini's
 * gemini-embedding-001 model (3072 dimensions).
 *
 * Works fully in serverless (Vercel/Render) environments — no ONNX model
 * downloads, no cold-start hang. Falls back to a deterministic hash vector
 * when the API is unavailable.
 */
class EmbeddingModel {
  constructor() {
    this.apiKey = process.env.GEMINI_API_KEY || '';
    this.model = 'gemini-embedding-001'; // 3072-dim, free-tier
    this.dimension = 3072;
    this.baseUrl = 'https://generativelanguage.googleapis.com/v1beta';
  }

  isConfigured() {
    return Boolean(
      this.apiKey &&
      this.apiKey.trim() !== '' &&
      this.apiKey !== 'YOUR_GEMINI_API_KEY_HERE'
    );
  }

  /**
   * Generates a single embedding via the Gemini Embeddings API.
   * @param {string} text
   * @param {string} taskType  'RETRIEVAL_DOCUMENT' for indexing, 'RETRIEVAL_QUERY' for queries
   * @returns {Promise<number[]>}
   */
  async getEmbedding(text, taskType = 'RETRIEVAL_QUERY') {
    const cleanText = (text || '').replace(/[\x00-\x08\x0b-\x0c\x0e-\x1f\x7f]/g, '').trim();
    if (!cleanText) return new Array(this.dimension).fill(0);

    if (this.isConfigured()) {
      try {
        const url = `${this.baseUrl}/models/${this.model}:embedContent?key=${this.apiKey}`;
        const response = await axios.post(url, {
          model: `models/${this.model}`,
          content: { parts: [{ text: cleanText.slice(0, 8000) }] },
          taskType
        }, {
          headers: { 'Content-Type': 'application/json' },
          timeout: 12000
        });
        const embedding = response.data?.embedding?.values;
        if (Array.isArray(embedding) && embedding.length > 0) {
          return embedding;
        }
      } catch (err) {
        console.warn('[EmbeddingModel] Gemini embedding API failed, using deterministic fallback:', err.message);
      }
    }

    // Deterministic fallback – same text always produces same vector
    return this.generateDeterministicVector(cleanText, this.dimension);
  }

  /**
   * Batch-embeds an array of text chunks for document indexing.
   * Uses RETRIEVAL_DOCUMENT task type for better recall.
   * @param {string[]} texts
   * @returns {Promise<number[][]>}
   */
  async getEmbeddings(texts) {
    if (!texts || texts.length === 0) return [];
    const results = [];
    for (const text of texts) {
      const emb = await this.getEmbedding(text, 'RETRIEVAL_DOCUMENT');
      results.push(emb);
    }
    return results;
  }

  // Legacy compat shim – kept so nothing breaks
  async getPipeline() {
    return null;
  }

  /**
   * Deterministic semantic hash vector as safety net.
   * Normalised to unit length for valid cosine similarity.
   */
  generateDeterministicVector(text, dimension) {
    const vector = new Array(dimension).fill(0);
    const words = text.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter(Boolean);

    for (let i = 0; i < words.length; i++) {
      const word = words[i];
      let hash = 5381;
      for (let j = 0; j < word.length; j++) {
        hash = ((hash << 5) + hash) + word.charCodeAt(j);
      }
      const idx = Math.abs(hash) % dimension;
      vector[idx] += 1.0 / Math.sqrt(i + 1);
    }

    let norm = 0;
    for (let i = 0; i < dimension; i++) norm += vector[i] * vector[i];
    norm = Math.sqrt(norm);
    if (norm > 0) {
      for (let i = 0; i < dimension; i++) vector[i] /= norm;
    }
    return vector;
  }
}

module.exports = EmbeddingModel;
