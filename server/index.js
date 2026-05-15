const express = require('express');
const cors = require('cors');
const multer = require('multer');
const RAGPipeline = require('./lib/RAGPipeline');
const connectDB = require('./lib/db');
const Document = require('./models/Document');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });

const app = express();
app.use(cors());
app.use(express.json());

// Set up Multer for Memory Storage (ideal for processing PDFs directly in memory without saving to disk)
const upload = multer({ storage: multer.memoryStorage() });

const rag = new RAGPipeline();

app.post('/api/ingest', upload.single('document'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded.' });
    }
    
    // Process RAG pipeline
    const result = await rag.ingestPDF(req.file.buffer, req.file.originalname);
    
    // Save PDF Binary to MongoDB (Only if connected)
    const mongoose = require('mongoose');
    if (mongoose.connection.readyState === 1) {
      const newDoc = new Document({
        filename: req.file.originalname,
        content: req.file.buffer,
        chunksCount: result.chunksAdded
      });
      await newDoc.save();
      console.log(`[MongoDB] Saved document: ${newDoc.filename}`);
      res.json({ ...result, mongoId: newDoc._id });
    } else {
      console.warn('[MongoDB] Connection not active. Processed Vector data only, skipped Mongo storage.');
      res.json(result);
    }
  } catch (error) {
    console.error('Ingest error:', error);
    res.status(500).json({ error: 'Internal Server Error during ingestion.' });
  }
});

app.post('/api/chat', async (req, res) => {
  try {
    const { message } = req.body;
    if (!message) {
      return res.status(400).json({ error: 'Message payload is required.' });
    }

    const response = await rag.askQuestion(message);
    res.json(response);
  } catch (error) {
    console.error('Chat error:', error);
    res.status(500).json({ error: 'Internal Server Error during chat generation.' });
  }
});

// Initialize vector store and start server
const PORT = process.env.PORT || 3001;

rag.init().then(() => {
  connectDB().then(() => {
    app.listen(PORT, () => {
      console.log(`Backend RAG Engine is running on http://localhost:${PORT}`);
    });
  });
});
