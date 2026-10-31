# StudyTree 🌳
### AI-Powered Academic Assistant for Students

StudyTree is an AI-powered academic assistant that helps students organize their study materials, understand uploaded documents, and prepare for examinations. It uses a Retrieval-Augmented Generation (RAG) pipeline to retrieve relevant information from a student's documents and generate context-aware answers.

---

## ✨ Features

- **Document Upload:** Upload academic PDF documents and study notes.
- **Document Processing:** Extract text from PDFs and divide it into smaller chunks for retrieval.
- **AI-Powered Q&A:** Ask questions about uploaded study material in natural language.
- **RAG Pipeline:** Retrieve relevant document content before generating an answer.
- **Semantic Search:** Find relevant passages using vector embeddings and cosine similarity.
- **AI Responses with Gemini:** Use the Google Gemini API to generate answers grounded in retrieved context.
- **Document Summarization:** Generate summaries of uploaded study material.
- **Document Library:** View and manage uploaded documents.
- **Chat History:** Access previous conversations and clear chat history.
- **Exam-Ready Mode:** Support focused exam preparation.
- **Pomodoro Timer:** Use timed study sessions.
- **Task Checklist:** Organize study tasks.
- **Suggested Prompts and Help:** Get prompt suggestions, status feedback, and quick guidance.

---

## 🛠️ Technology Stack

| Component | Technologies |
|---|---|
| Frontend | React 19, Vite 7, JavaScript |
| UI and Styling | HTML5, CSS, Lucide React |
| Backend | Node.js, Express 5 |
| Database / Persistence | MongoDB, Mongoose, JSON-based local persistence |
| File Upload | Multer |
| PDF Text Extraction | pdf-parse |
| Embedding Generation | Transformers.js |
| Embedding Model | Xenova/all-MiniLM-L6-v2 |
| Vector Search | Custom vector store, cosine similarity |
| AI Response Generation | Google Gemini API |

---

## 🧠 How StudyTree Works

1. **Upload:** A student uploads a PDF through the React frontend.
2. **Receive:** The Express backend receives the uploaded file using Multer.
3. **Extract:** pdf-parse extracts text from the PDF.
4. **Chunk:** The extracted text is divided into smaller, overlapping text chunks.
5. **Embed:** Transformers.js uses Xenova/all-MiniLM-L6-v2 to convert text chunks into numerical embeddings.
6. **Store:** The generated vectors and document information are stored for retrieval.
7. **Query:** When a student asks a question, the question is also converted into an embedding.
8. **Retrieve:** The vector store compares the query embedding with stored embeddings using cosine similarity and retrieves relevant chunks.
9. **Generate:** The retrieved context is passed to the Google Gemini API to generate a response.
10. **Display:** The generated answer is returned to the frontend and displayed in the chat interface.

### RAG Pipeline

PDF Upload
    |
    v
Text Extraction (pdf-parse)
    |
    v
Text Chunking
    |
    v
Embedding Generation
(Transformers.js - all-MiniLM-L6-v2)
    |
    v
Vector Store
    |
    v
Student Question
    |
    v
Query Embedding
    |
    v
Cosine Similarity Search
    |
    v
Relevant Context Retrieval
    |
    v
Google Gemini API
    |
    v
Context-Aware Answer

### Embedding and Retrieval Configuration

- **Embedding model:** Xenova/all-MiniLM-L6-v2
- **Embedding dimensions:** 384
- **Approximate chunk size:** 750 characters
- **Approximate chunk overlap:** 150 characters
- **Similarity method:** Cosine similarity
- **Retrieval configuration:** Top 4 chunks, with a similarity threshold of 0.20

These values describe implementation settings; they are not benchmarked accuracy or performance results.

---

## 🏗️ Project Structure

```text
StudyTree/
├── src/
│   ├── App.jsx
│   ├── App.css
│   └── index.css
│
├── server/
│   ├── index.js
│   ├── lib/
│   │   ├── RAGPipeline.js
│   │   ├── EmbeddingModel.js
│   │   ├── VectorStore.js
│   │   ├── GeminiModel.js
│   │   ├── DocumentStore.js
│   │   ├── ChatStore.js
│   │   └── db.js
│   │
│   ├── models/
│   │   ├── Document.js
│   │   └── ChatMessage.js
│   │
│   └── data/
│
├── public/
├── index.html
├── package.json
├── vite.config.js
└── README.md
