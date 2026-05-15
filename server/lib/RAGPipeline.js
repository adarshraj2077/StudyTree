const pdfParse = require('pdf-parse');
const VectorStore = require('./VectorStore');
const EmbeddingModel = require('./EmbeddingModel');
const GrokModel = require('./GrokModel');

class RAGPipeline {
  constructor() {
    this.vectorStore = new VectorStore();
    this.embeddingModel = new EmbeddingModel();
    this.grokModel = new GrokModel();
  }

  async init() {
    await this.vectorStore.load();
  }

  /**
   * Chunks a large string into smaller segments.
   */
  chunkText(text, chunkSize = 1000, overlap = 200) {
    const chunks = [];
    let i = 0;
    while (i < text.length) {
      const end = Math.min(i + chunkSize, text.length);
      chunks.push(text.substring(i, end));
      i += (chunkSize - overlap); // shift forward
    }
    return chunks;
  }

  /**
   * Processes a PDF file buffer, chunks it, embeds it, and stores it in Vector Store
   * @param {Buffer} fileBuffer 
   * @param {string} filename 
   */
  async ingestPDF(fileBuffer, filename) {
    console.log(`[RAGPipeline] Parsing PDF: ${filename}...`);
    const data = await pdfParse(fileBuffer);
    const rawText = data.text;
    
    console.log(`[RAGPipeline] Chunking text...`);
    const chunks = this.chunkText(rawText);
    
    console.log(`[RAGPipeline] Generating embeddings for ${chunks.length} chunks...`);
    const embeddings = await this.embeddingModel.getEmbeddings(chunks);
    
    const itemsToStore = chunks.map((chunkText, idx) => ({
      id: `${filename}_chunk_${idx}`,
      text: chunkText,
      metadata: { source: filename, idx },
      embedding: embeddings[idx]
    }));

    await this.vectorStore.addVectors(itemsToStore);
    return { success: true, chunksAdded: chunks.length };
  }

  /**
   * Answers a question using the RAG technique.
   * @param {string} query 
   */
  async askQuestion(query) {
    // 1. Get embedding for question
    const queryEmbedding = await this.embeddingModel.getEmbedding(query);

    // 2. Search for relevant chunks
    const relevantChunks = await this.vectorStore.search(queryEmbedding, 3);
    
    if (relevantChunks.length === 0) {
      return { answer: "I'm sorry, I don't have any context in my database yet. Please go to the **Document Summarizer** tab and upload a PDF document first!" };
    }

    // 3. Construct Context string
    const contextContent = relevantChunks.map(c => `[From ${c.metadata.source}]:\n${c.text}`).join('\n\n');

    // 4. Create prompt bounds
    const systemPrompt = `You are a helpful study assistant. Use the following fetched document context to answer the user's question accurately. Do not invent information outside of this context. If the answer is not in the context, say "I don't know based on the provided documents."\n\n=== CONTEXT ===\n${contextContent}\n=== END CONTEXT ===`;

    // 5. Query Grok
    const answer = await this.grokModel.generateAnswer(systemPrompt, query);
    
    return {
      answer,
      sources: relevantChunks.map(c => c.metadata.source)
    };
  }
}

module.exports = RAGPipeline;
