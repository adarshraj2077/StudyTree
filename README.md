# StudyTree 🌳

**An AI-powered study assistant that turns your own notes and documents into an interactive, context-aware learning companion.**

StudyTree helps students organize their coursework and get instant, accurate answers grounded in their own study material — instead of generic AI responses that don't know what's actually in their syllabus, notes, or textbooks.

---

## ✨ Features

- **Study Organization** – Structure and manage subjects, topics, and study material in one place.
- **Document-Based Learning** – Upload PDFs and study documents directly into the platform.
- **Retrieval-Augmented Generation (RAG) Pipeline** – Answers are generated using your uploaded documents as context, not just the model's general knowledge, reducing hallucination and keeping responses relevant to your syllabus.
- **Semantic Search** – Custom vector search over embedded document content to retrieve the most relevant sections before generating an answer.
- **Local LLM Embeddings** – Uses Ollama running LLaMA 3 to generate embeddings, keeping document processing local and cost-efficient.
- **AI-Powered Q&A** – Ask questions in natural language and get context-aware answers backed by the Grok API.

---

## 🛠️ Tech Stack

**Frontend**
- React.js
- Vite
- React Router

**Backend**
- Node.js
- Express.js

**Database**
- MongoDB with Mongoose (ODM)

**AI / ML**
- Ollama (LLaMA 3) – local embedding generation
- Custom vector search implementation
- Grok API – context-aware answer generation
- PDF parsing pipeline for document ingestion

---

## ⚙️ How It Works

1. **Upload** – A student uploads study documents (PDFs, notes) into StudyTree.
2. **Parse & Chunk** – Documents are parsed and split into meaningful sections.
3. **Embed** – Each section is converted into vector embeddings using LLaMA 3 via Ollama.
4. **Store & Index** – Embeddings are stored and indexed for fast semantic retrieval.
5. **Query** – When a student asks a question, StudyTree retrieves the most relevant document sections via vector search.
6. **Generate** – The retrieved context is passed to the Grok API, which generates an accurate, grounded answer.

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+ recommended)
- MongoDB instance (local or Atlas)
- [Ollama](https://ollama.com) installed locally with the LLaMA 3 model pulled
- A Grok API key

### Installation

```bash
# Clone the repository
git clone https://github.com/adarshraj2077/StudyTree.git
cd StudyTree

# Install frontend dependencies
npm install

# Install backend dependencies
cd server
npm install
cd ..
```

### Environment Variables

Create a `.env` file in the `server/` directory with:

```env
MONGODB_URI=your_mongodb_connection_string
GROK_API_KEY=your_grok_api_key
OLLAMA_HOST=http://localhost:11434
PORT=5000
```

### Running Locally

```bash
# Runs both frontend (Vite) and backend (Node/Express) concurrently
npm run dev
```

The app will be available at `http://localhost:5173` (frontend) with the API running on `http://localhost:5000`.

---

## 📌 Project Status

Actively developed — core RAG pipeline and study-organization features are functional. Planned improvements include [add anything you're planning, e.g. multi-document cross-referencing, quiz generation, mobile support].

---

## 📄 License

[Add your preferred license, e.g. MIT]
