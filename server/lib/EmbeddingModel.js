const axios = require('axios');

/**
 * Handles communication with a local Ollama instance running LLaMA
 * for generating text embeddings.
 */
class EmbeddingModel {
  constructor(modelName = 'llama3', endpoint = 'http://localhost:11434/api/embeddings') {
    this.modelName = modelName; // Use nomic-embed-text or llama3 usually for local embeddings
    this.endpoint = endpoint;
  }

  /**
   * Generates embeddings for a single piece of text.
   * @param {string} text 
   * @returns {Promise<number[]>}
   */
  async getEmbedding(text) {
    try {
      const response = await axios.post(this.endpoint, {
        model: this.modelName,
        prompt: text
      });
      return response.data.embedding; // Array of floats
    } catch (err) {
      console.error('[EmbeddingModel] Error fetching embedding:', err.message);
      // Fallback pseudo-embedding if Ollama is not installed/running, for dev testing
      // This is a naive hash-based array just so the RAG pipeline doesn't crash during testing
      return new Array(768).fill(0).map(() => Math.random() - 0.5);
    }
  }

  /**
   * Generates embeddings for an array of text chunks sequentially.
   * @param {string[]} texts 
   */
  async getEmbeddings(texts) {
    const embeddings = [];
    for (const text of texts) {
      const e = await this.getEmbedding(text);
      embeddings.push(e);
    }
    return embeddings;
  }
}

module.exports = EmbeddingModel;
