# StudyTree – AI-Powered Academic Assistant for Students

StudyTree is a web-based study assistant. Students upload their own PDF notes and then ask questions, get summaries, practise exam-style questions, and manage study tasks in one workspace. Answers are grounded in the uploaded documents using Retrieval-Augmented Generation (RAG).

Built as a Human–Computer Interaction (HCI) mini-project at Manipal University Jaipur by Adarsh Raj (23FE10CAI00527) and Ananya Maheshwari (23FE10CAI00015).

**Live demo:** https://study-tree-ysfw.vercel.app/

## Features

- PDF upload with text extraction, summary and key points
- Document-grounded AI chat (semantic search + Gemini)
- Exam-oriented practice mode
- Document library with search, filter and delete
- Pomodoro-style focus timer
- Study-task checklist
- Chat history

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React, Vite, CSS, Lucide React |
| Backend | Node.js, Express |
| PDF handling | Multer, pdf-parse |
| Embeddings | all-MiniLM-L6-v2 via Transformers.js (local, 384-d) |
| Retrieval | Custom vector store (cosine similarity, top-K) |
| Generation | Google Gemini API (with fallback path) |
| Storage | MongoDB (Mongoose) with local JSON fallback |

## How it works

1. A PDF is uploaded, its text is extracted and split into overlapping chunks.
2. Each chunk is converted into an embedding locally and stored in the vector store.
3. For a question, the most similar chunks are retrieved and sent to Gemini as context.
4. The answer is shown in the chat along with source information.

## Run locally

Requirements: Node.js and npm, and a Gemini API key.

```bash
# 1. Clone
git clone https://github.com/adarshraj2077/StudyTree.git
cd StudyTree

# 2. Frontend dependencies
npm install

# 3. Backend dependencies and environment file
cd server
npm install
cp .env.example .env      # then open .env and add your Gemini API key
```

Start the backend (from `server/`) and the frontend (from the project root) in two terminals:

```bash
# Terminal 1 – backend
cd server
npm start

# Terminal 2 – frontend
npm run dev
```

Open the local URL printed by Vite (usually http://localhost:5173).

MongoDB is optional: if it is not configured, documents and chat history are stored in local JSON files.

## Project structure

```
StudyTree/
├── src/            React frontend (App.jsx, App.css, index.css)
├── public/
└── server/
    ├── index.js    Express server and REST API
    ├── lib/        RAG pipeline, embeddings, vector store, Gemini, stores
    ├── models/     Mongoose schemas
    └── test_fixtures/  Sample PDF and test scripts
```

## Notes

- Scanned or image-only PDFs are not supported (no OCR).
- Answers are grounded in the uploaded documents but are not guaranteed to be correct.
- Never commit your real `.env` file or API key.
