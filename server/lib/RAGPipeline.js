const VectorStore = require('./VectorStore');
const EmbeddingModel = require('./EmbeddingModel');
const GeminiModel = require('./GeminiModel');
const DocumentStore = require('./DocumentStore');

class RAGPipeline {
  constructor() {
    this.vectorStore = new VectorStore();
    this.embeddingModel = new EmbeddingModel();
    this.geminiModel = new GeminiModel();
    this.llmModel = this.geminiModel;
    this.grokModel = this.geminiModel;
    this.documentStore = new DocumentStore();
  }

  async init() {
    console.log('[RAGPipeline] Initializing storage and embedding models...');
    await this.vectorStore.load();
    await this.documentStore.init();
    // Warm up embedding pipeline in background
    this.embeddingModel.getPipeline().catch(err => {
      console.warn('[RAGPipeline] Background embedding warm-up notice:', err.message);
    });
  }

  /**
   * Robust text extractor supporting both functional and class-based pdf-parse exports.
   * @param {Buffer} fileBuffer 
   * @returns {Promise<string>}
   */
  async extractTextFromPDF(fileBuffer) {
    if (!fileBuffer || fileBuffer.length === 0) {
      throw new Error('PDF buffer is empty.');
    }

    const pdfModule = require('pdf-parse');
    let text = '';

    if (typeof pdfModule === 'function') {
      const data = await pdfModule(fileBuffer);
      text = data.text || '';
    } else if (pdfModule.PDFParse) {
      const parser = new pdfModule.PDFParse({ data: fileBuffer });
      const result = await parser.getText();
      text = result.text || '';
      if (typeof parser.destroy === 'function') {
        await parser.destroy();
      }
    } else if (pdfModule.default && typeof pdfModule.default === 'function') {
      const data = await pdfModule.default(fileBuffer);
      text = data.text || '';
    } else {
      throw new Error('Unsupported pdf-parse interface');
    }

    const cleanedText = text.replace(/\x00/g, '').trim();
    if (!cleanedText || cleanedText.length < 15) {
      throw new Error('The uploaded PDF does not contain extractable text. Scanned or image-only documents require OCR, or the file is blank.');
    }

    return cleanedText;
  }

  /**
   * Sentence- and paragraph-aware text chunking.
   * Creates overlapping chunks that preserve coherent semantic boundaries.
   */
  chunkText(text, chunkSize = 750, overlap = 150) {
    const clean = text.replace(/\r\n/g, '\n').replace(/\n{3,}/g, '\n\n');
    const paragraphs = clean.split(/\n\s*\n/);
    const chunks = [];
    let currentChunk = '';

    for (const paragraph of paragraphs) {
      const p = paragraph.trim();
      if (!p) continue;

      if ((currentChunk.length + p.length) <= chunkSize) {
        currentChunk = currentChunk ? `${currentChunk}\n\n${p}` : p;
      } else {
        if (currentChunk.length > 0) {
          chunks.push(currentChunk);
          // Overlap retention: keep the tail of currentChunk
          const tail = currentChunk.slice(-overlap);
          currentChunk = `${tail}\n\n${p}`;
        } else {
          // Paragraph itself exceeds chunkSize; segment by sentence
          const sentences = p.split(/(?<=[.?!])\s+/);
          let subChunk = '';
          for (const sent of sentences) {
            if ((subChunk.length + sent.length) <= chunkSize) {
              subChunk = subChunk ? `${subChunk} ${sent}` : sent;
            } else {
              if (subChunk) chunks.push(subChunk);
              subChunk = sent;
            }
          }
          if (subChunk) chunks.push(subChunk);
          currentChunk = '';
        }
      }
    }

    if (currentChunk.trim()) {
      chunks.push(currentChunk.trim());
    }

    // Safety fallback: if no paragraphs, chunk by fixed window
    if (chunks.length === 0) {
      let i = 0;
      while (i < clean.length) {
        const end = Math.min(i + chunkSize, clean.length);
        chunks.push(clean.substring(i, end));
        i += (chunkSize - overlap);
      }
    }

    return chunks.filter(c => c && c.trim().length > 20);
  }

  /**
   * Ingests a PDF file, parses text, chunks it, generates embeddings,
   * generates summary/keypoints, and indexes chunks into VectorStore & DocumentStore.
   */
  async ingestPDF(fileBuffer, originalname) {
    console.log(`[RAGPipeline] Ingesting PDF: "${originalname}" (${(fileBuffer.length / 1024).toFixed(1)} KB)...`);
    
    // 1. Text extraction
    const rawText = await this.extractTextFromPDF(fileBuffer);
    console.log(`[RAGPipeline] Extracted ${rawText.length} characters of clean text.`);

    // 2. Semantic chunking
    const chunks = this.chunkText(rawText);
    console.log(`[RAGPipeline] Generated ${chunks.length} semantic chunks.`);

    // 3. Dense embeddings generation
    console.log(`[RAGPipeline] Generating dense 384-d embeddings using all-MiniLM-L6-v2...`);
    const embeddings = await this.embeddingModel.getEmbeddings(chunks);

    // 4. Summary & keypoints extraction
    console.log(`[RAGPipeline] Extracting summary and key takeaways...`);
    const { summary, keyPoints } = await this.grokModel.generateSummaryAndKeyPoints(rawText, originalname);

    // 5. Index chunks in VectorStore
    const docId = `doc_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const itemsToStore = chunks.map((chunkText, idx) => ({
      id: `${docId}_chunk_${idx}`,
      text: chunkText,
      metadata: {
        source: originalname,
        docId,
        idx,
        total: chunks.length
      },
      embedding: embeddings[idx]
    }));

    await this.vectorStore.addVectors(itemsToStore);

    // 6. Save document metadata in DocumentStore / MongoDB
    const docRecord = {
      id: docId,
      docId,
      name: originalname,
      filename: originalname,
      fileSize: fileBuffer.length,
      chunksCount: chunks.length,
      summary,
      keyPoints,
      date: new Date().toLocaleDateString(),
      status: 'ready'
    };

    await this.documentStore.addDocument(docRecord);

    console.log(`[RAGPipeline] Successfully indexed "${originalname}" with ${chunks.length} chunks.`);

    return {
      success: true,
      docId,
      name: originalname,
      filename: originalname,
      chunksAdded: chunks.length,
      summary,
      keyPoints,
      fileSize: fileBuffer.length,
      date: docRecord.date
    };
  }

  /**
   * Retrieves context chunks and answers a user question with Grok.
   */
  async askQuestion({ message, documentName = null, docId = null, mode = 'general' }) {
    if (!message || typeof message !== 'string') {
      throw new Error('Message is required.');
    }

    // Determine target document filter if specified
    let filterSource = documentName;
    if (!filterSource && docId) {
      const doc = this.documentStore.getById(docId);
      if (doc) filterSource = doc.name;
    }

    console.log(`[RAGPipeline] Answering query: "${message.slice(0, 60)}..." (Filter: ${filterSource || 'ALL'}, Mode: ${mode})`);

    // 1. Generate query embedding
    const queryEmbedding = await this.embeddingModel.getEmbedding(message);

    // 2. Dense vector search
    const relevantChunks = await this.vectorStore.search(queryEmbedding, {
      topK: 4,
      filterSource,
      minScore: 0.20
    });

    if (relevantChunks.length === 0) {
      const targetMsg = filterSource 
        ? `in "${filterSource}"` 
        : 'in your uploaded study materials';
      return {
        answer: `I could not find relevant information answering your question ${targetMsg}. The uploaded content does not appear to discuss this topic. Please try rephrasing or upload a document that covers it.`,
        sources: [],
        chunksUsed: 0,
        score: 0
      };
    }

    // 3. Construct bounded context string
    const contextContent = relevantChunks.map((c, i) => 
      `--- [Source: ${c.metadata?.source || 'Document'} | Chunk #${c.metadata?.idx || i + 1} | Relevance Score: ${(c.score * 100).toFixed(1)}%] ---\n${c.text}`
    ).join('\n\n');

    // 4. Construct grounded system prompt
    let systemPrompt = '';
    if (mode === 'exam') {
      systemPrompt = `You are StudyTree's Exam Mode Knowledge Evaluator.
Your goal is to test the student or evaluate their understanding strictly based on the verified study context below.
Rules:
1. Ground every statement strictly in the provided context.
2. If the user is asking a technical question, explain the precise answer using the context.
3. If the user is answering a mock exam question, grade their answer as Correct, Partially Correct, or Incorrect, explaining why using the excerpt.
4. If the information is not in the context, explicitly state: "This concept is not covered in the selected document."

=== VERIFIED DOCUMENT CONTEXT ===
${contextContent}
=== END CONTEXT ===`;
    } else {
      systemPrompt = `You are StudyTree CS Study Assistant, an expert AI tutor.
Answer the user's question accurately, concisely, and helpfully based ONLY on the following fetched document context.
Rules:
1. Always base your response on the provided context snippets.
2. Explain concepts clearly using clean paragraphs and bullet points. Mention source document names naturally at the end rather than littering every sentence with chunk tags.
3. Do not invent or assume facts beyond the context. If the answer is not present, clearly state: "Based on the provided documents, I do not have enough information to answer that."

=== VERIFIED DOCUMENT CONTEXT ===
${contextContent}
=== END CONTEXT ===`;
    }

    // 5. Query Grok Model (or grounded engine fallback)
    const answer = await this.grokModel.generateAnswer(systemPrompt, message, relevantChunks);

    const sources = Array.from(new Set(relevantChunks.map(c => c.metadata?.source).filter(Boolean)));

    return {
      answer,
      sources,
      chunksUsed: relevantChunks.length,
      score: relevantChunks[0]?.score || 0
    };
  }

  getDocuments() {
    return this.documentStore.getAll();
  }

  async deleteDocument(id) {
    const { removed, doc } = await this.documentStore.deleteDocument(id);
    if (doc) {
      await this.vectorStore.removeBySource(doc.name);
      await this.vectorStore.removeByDocId(doc.docId);
    } else {
      await this.vectorStore.removeBySource(id);
      await this.vectorStore.removeByDocId(id);
    }
    return { success: true, removed };
  }
}

module.exports = RAGPipeline;


