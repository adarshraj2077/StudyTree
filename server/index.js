const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });

const RAGPipeline = require('./lib/RAGPipeline');
const ChatStore = require('./lib/ChatStore');
const { connectDB, isDBConnected } = require('./lib/db');

const app = express();

// Security and middleware
app.use(cors({
  origin: true,
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Configure Multer for PDF memory buffer ingestion (limit 25MB)
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 25 * 1024 * 1024 }, // 25 MB max
  fileFilter: (req, file, cb) => {
    const isPdfMime = file.mimetype === 'application/pdf';
    const isPdfExt = path.extname(file.originalname).toLowerCase() === '.pdf';
    if (isPdfMime || isPdfExt) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF documents are supported for ingestion.'));
    }
  }
});

const rag = new RAGPipeline();
const chatStore = new ChatStore();

/**
 * Root health & redirect page
 */
app.get('/', (req, res) => {
  const healthData = {
    status: 'online',
    uptime: `${Math.floor(process.uptime())}s`,
    database: isDBConnected() ? 'MongoDB Connected' : 'Local JSON Persistence',
    indexedDocuments: rag.getDocuments().length,
    vectorChunks: rag.vectorStore.getChunkCount(),
    embeddingModel: 'sentence-transformers/all-MiniLM-L6-v2 (384-d dense vectors)'
  };

  res.send(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>StudyTree Backend Status & API</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #0b0f19; color: #f8fafc; padding: 2rem; margin: 0; display: flex; justify-content: center; align-items: center; min-height: 100vh;">
        <div style="background: #1e293b; border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 16px; max-width: 620px; width: 100%; padding: 2.5rem; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);">
          
          <div style="display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid #334155; padding-bottom: 1.25rem; margin-bottom: 1.5rem;">
            <div style="display: flex; align-items: center; gap: 0.75rem;">
              <span style="font-size: 2rem;">🌲</span>
              <div>
                <h2 style="margin: 0; font-size: 1.4rem; color: #38bdf8;">StudyTree Backend Engine</h2>
                <span style="font-size: 0.8rem; color: #94a3b8;">Express RAG & Knowledge Microservice</span>
              </div>
            </div>
            <span style="background: rgba(34, 197, 94, 0.2); color: #4ade80; border: 1px solid rgba(34, 197, 94, 0.4); padding: 0.35rem 0.85rem; border-radius: 999px; font-size: 0.8rem; font-weight: 600;">
              ● Online (Port 3001)
            </span>
          </div>

          <h3 style="font-size: 1rem; color: #e2e8f0; margin-bottom: 0.75rem;">Live System Metrics</h3>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; margin-bottom: 1.75rem;">
            <div style="background: #0f172a; padding: 1rem; border-radius: 8px; border: 1px solid #334155;">
              <div style="color: #94a3b8; font-size: 0.75rem; text-transform: uppercase;">Indexed Documents</div>
              <div style="font-size: 1.4rem; font-weight: 700; color: #38bdf8; margin-top: 0.25rem;">${healthData.indexedDocuments}</div>
            </div>
            <div style="background: #0f172a; padding: 1rem; border-radius: 8px; border: 1px solid #334155;">
              <div style="color: #94a3b8; font-size: 0.75rem; text-transform: uppercase;">Vector Chunks in DB</div>
              <div style="font-size: 1.4rem; font-weight: 700; color: #a855f7; margin-top: 0.25rem;">${healthData.vectorChunks}</div>
            </div>
            <div style="background: #0f172a; padding: 1rem; border-radius: 8px; border: 1px solid #334155;">
              <div style="color: #94a3b8; font-size: 0.75rem; text-transform: uppercase;">Persistence Engine</div>
              <div style="font-size: 0.95rem; font-weight: 600; color: #f1f5f9; margin-top: 0.4rem;">${healthData.database}</div>
            </div>
            <div style="background: #0f172a; padding: 1rem; border-radius: 8px; border: 1px solid #334155;">
              <div style="color: #94a3b8; font-size: 0.75rem; text-transform: uppercase;">Server Uptime</div>
              <div style="font-size: 0.95rem; font-weight: 600; color: #f1f5f9; margin-top: 0.4rem;">${healthData.uptime}</div>
            </div>
          </div>

          <h3 style="font-size: 1rem; color: #e2e8f0; margin-bottom: 0.75rem;">Explore Backend JSON Endpoints</h3>
          <div style="display: flex; flex-direction: column; gap: 0.5rem; margin-bottom: 2rem;">
            <a href="/api/health" target="_blank" style="display: flex; justify-content: space-between; padding: 0.6rem 1rem; background: #0f172a; border: 1px solid #334155; border-radius: 6px; color: #38bdf8; text-decoration: none; font-size: 0.85rem; font-family: monospace;">
              <span>GET /api/health</span>
              <span style="color: #94a3b8;">View Full Diagnostics JSON &rarr;</span>
            </a>
            <a href="/api/documents" target="_blank" style="display: flex; justify-content: space-between; padding: 0.6rem 1rem; background: #0f172a; border: 1px solid #334155; border-radius: 6px; color: #38bdf8; text-decoration: none; font-size: 0.85rem; font-family: monospace;">
              <span>GET /api/documents</span>
              <span style="color: #94a3b8;">View Ingested PDF List &rarr;</span>
            </a>
            <a href="/api/chat/history?mode=general" target="_blank" style="display: flex; justify-content: space-between; padding: 0.6rem 1rem; background: #0f172a; border: 1px solid #334155; border-radius: 6px; color: #38bdf8; text-decoration: none; font-size: 0.85rem; font-family: monospace;">
              <span>GET /api/chat/history</span>
              <span style="color: #94a3b8;">View Stored Chat Log &rarr;</span>
            </a>
          </div>

          <a href="http://localhost:5173" style="display: block; text-align: center; background: #3b82f6; color: white; padding: 0.85rem; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 0.95rem;">
            Open StudyTree Web App (http://localhost:5173) &rarr;
          </a>
        </div>
      </body>
    </html>
  `);
});

/**
 * Health check & diagnostics endpoint
 */
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'StudyTree RAG Engine',
    uptimeSeconds: Math.floor(process.uptime()),
    mongodb: {
      connected: isDBConnected(),
      mode: isDBConnected() ? 'MongoDB Replica/Standalone Active' : 'Resilient Local JSON Persistence Active'
    },
    ragPipeline: {
      activeDocuments: rag.getDocuments().length,
      indexedChunks: rag.vectorStore.getChunkCount(),
      embeddingModel: 'sentence-transformers/all-MiniLM-L6-v2 (384-dimensional dense vectors)',
      geminiConfigured: rag.geminiModel.isConfigured(),
        grokConfigured: rag.geminiModel.isConfigured()
    }
  });
});

/**
 * Get all ingested documents with metadata and summaries
 */
app.get('/api/documents', (req, res) => {
  try {
    const docs = rag.getDocuments();
    res.json(docs);
  } catch (error) {
    console.error('[API] Error fetching documents:', error.message);
    res.status(500).json({ error: 'Failed to fetch document library.' });
  }
});

/**
 * Delete a document and purge its vectors
 */
app.delete('/api/documents/:id', async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ error: 'Document ID is required.' });
    }
    const result = await rag.deleteDocument(id);
    res.json({ success: true, message: `Document ${id} and associated vector chunks purged.`, ...result });
  } catch (error) {
    console.error('[API] Error deleting document:', error.message);
    res.status(500).json({ error: 'Failed to delete document from storage.' });
  }
});

/**
 * Upload and ingest PDF document into the RAG pipeline
 */
app.post('/api/ingest', (req, res) => {
  upload.single('document')(req, res, async (err) => {
    if (err instanceof multer.MulterError) {
      return res.status(400).json({ error: `Upload error: ${err.message}` });
    } else if (err) {
      return res.status(400).json({ error: err.message });
    }

    try {
      if (!req.file || !req.file.buffer) {
        return res.status(400).json({ error: 'No PDF file was provided in the "document" form field.' });
      }

      console.log(`[API] Processing upload: "${req.file.originalname}" (${(req.file.size / 1024).toFixed(1)} KB)`);

      const result = await rag.ingestPDF(req.file.buffer, req.file.originalname);
      return res.status(200).json(result);
    } catch (error) {
      console.error('[API] Ingest processing error:', error.message);
      const isExtractionError = error.message.includes('extractable text') || error.message.includes('PDF buffer is empty');
      return res.status(isExtractionError ? 422 : 500).json({
        error: error.message || 'Internal error occurred during document processing.'
      });
    }
  });
});

/**
 * Chat and knowledge query endpoint with context grounding
 */

/**
 * Chat history endpoint
 */
app.get('/api/chat/history', (req, res) => {
  try {
    const mode = req.query.mode || 'general';
    const docId = req.query.docId || null;
    const history = chatStore.getHistory(mode, docId);
    res.json(history);
  } catch (error) {
    console.error('[API] Error fetching chat history:', error.message);
    res.status(500).json({ error: 'Failed to retrieve chat history.' });
  }
});

/**
 * Clear chat history endpoint
 */
app.post('/api/chat/clear', async (req, res) => {
  try {
    const { mode, docId } = req.body;
    await chatStore.clearHistory(mode || 'general', docId || null);
    res.json({ success: true, message: `Chat history cleared.` });
  } catch (error) {
    console.error('[API] Error clearing chat history:', error.message);
    res.status(500).json({ error: 'Failed to clear chat history.' });
  }
});

app.post('/api/chat', async (req, res) => {
  try {
    const { message, docId, documentName, mode } = req.body;
    if (!message || typeof message !== 'string' || !message.trim()) {
      return res.status(400).json({ error: 'A valid non-empty "message" string is required.' });
    }

    // Persist user prompt
    await chatStore.addMessage({
      role: 'user',
      text: message.trim(),
      mode: mode || 'general',
      docId: docId || null
    });

    const response = await rag.askQuestion({
      message: message.trim(),
      docId,
      documentName,
      mode: mode || 'general'
    });

    // Persist bot answer
    await chatStore.addMessage({
      role: 'bot',
      text: response.answer || response.text || '',
      sources: response.sources || [],
      mode: mode || 'general',
      docId: docId || null
    });

    res.json(response);
  } catch (error) {
    console.error('[API] Chat error:', error.message);
    res.status(500).json({
      error: 'Error generating response.',
      details: error.message
    });
  }
});

// Initialize vector store, sync document store, connect DB, and start server
const PORT = process.env.PORT || 3001;

async function startServer() {
  try {
    await rag.init();
    await chatStore.init();
    await connectDB(); // Attempts Mongo connection with graceful fallback

    app.listen(PORT, () => {
      console.log('====================================================');
      console.log(` StudyTree RAG Engine is active at: http://localhost:${PORT}`);
      console.log(` Health check: http://localhost:${PORT}/api/health`);
      console.log(` Storage: ${isDBConnected() ? 'MongoDB Connected' : 'Resilient Local Storage'}`);
      console.log(` Embedding Model: sentence-transformers/all-MiniLM-L6-v2`);
      console.log(` LLM: ${rag.geminiModel.isConfigured() ? 'Gemini 1.5 Flash (Live API)' : 'Context-Grounded Engine (Demo Ready)'}`);
      console.log('====================================================');
    });
  } catch (err) {
    console.error('[Server] Fatal startup error:', err);
    process.exit(1);
  }
}

startServer();


