# Indian Startup Legal Assistant

An AI-powered **Retrieval-Augmented Generation (RAG)** legal assistant built to help Indian startup founders understand legal and regulatory topics. The application combines local legal documents with current information from official Indian government sources using **ChromaDB**, **Tavily**, and **Ollama**.

> **Disclaimer:** This project provides general legal information for educational and informational purposes only. It is **not** legal advice.

---

# Features

- AI-powered startup legal assistant
- Retrieval-Augmented Generation (RAG)
- Local legal document search using ChromaDB
- Current legal information using Tavily
- Local LLM with Ollama (Qwen3 0.6B)
- React + TypeScript chat interface
- FastAPI backend
- SQLite chat history
- Streaming AI responses
- Session management
- Automatic web + document retrieval

---

# Architecture

```text
                    ┌──────────────────────┐
                    │   React Frontend     │
                    │    Vite + React      │
                    └──────────┬───────────┘
                               │
                               │ HTTP
                               ▼
                    ┌──────────────────────┐
                    │    FastAPI Backend   │
                    │       main.py        │
                    └──────────┬───────────┘
                               │
               ┌───────────────┴────────────────┐
               │                                │
               ▼                                ▼
     ┌─────────────────────┐          ┌───────────────────┐
     │  Chroma Vector DB   │          │  Tavily Search    │
     │ Local Legal PDFs    │          │ Government Sources│
     └──────────┬──────────┘          └─────────┬─────────┘
                │                               │
                └──────────────┬────────────────┘
                               ▼
                    ┌──────────────────────┐
                    │   Ollama (Qwen3)     │
                    └──────────┬───────────┘
                               ▼
                    ┌──────────────────────┐
                    │   Legal Response     │
                    └──────────────────────┘
```

---

# Tech Stack

## Backend

- Python
- FastAPI
- Uvicorn
- SQLAlchemy
- SQLite

## AI & RAG

- LangChain
- ChromaDB
- HuggingFace Embeddings
- Ollama
- Qwen3 0.6B
- Tavily Search

## Frontend

- React
- TypeScript
- Vite
- Framer Motion
- React Markdown
- Lucide React

---

# Project Structure

```text
legal_asistant_chtbot/
│
├── app.py
├── main.py
├── database.py
├── models.py
├── build_db.py
├── requirements.txt
├── package.json
├── .env
├── .gitignore
├── README.md
│
├── data/
│   └── Indian legal documents
│
├── chroma_db/
│   └── Vector database
│
├── react-app/
│   ├── src/
│   ├── package.json
│   └── vite.config.ts
│
└── chat.db
```

---

# How It Works

1. User asks a legal question.
2. ChromaDB retrieves relevant legal documents.
3. Tavily retrieves current information from official Indian government sources.
4. Both contexts are combined.
5. Ollama generates a grounded response.
6. Chat history is stored in SQLite.

```text
User Question
      │
      ▼
Question Filter
      │
      ├───────────────┐
      ▼               ▼
 ChromaDB         Tavily Search
 Local PDFs       Official Sources
      │               │
      └───────┬───────┘
              ▼
       Retrieved Context
              ▼
       Ollama (Qwen3)
              ▼
       Final Response
```

---

# Installation

## 1. Clone Repository

```bash
git clone https://github.com/roshanrajan427-code/legal_asistant_chtbot.git
cd legal_asistant_chtbot
```

## 2. Create Virtual Environment

```powershell
python -m venv venv
```

Activate:

```powershell
.\venv\Scripts\Activate.ps1
```

## 3. Install Python Dependencies

```powershell
pip install -r requirements.txt
```

If needed:

```powershell
pip install fastapi uvicorn sqlalchemy langchain langchain-community langchain-ollama chromadb sentence-transformers tavily-python python-dotenv pypdf
```

## 4. Install Frontend Dependencies

```powershell
cd react-app
npm install
cd ..
```

## 5. Install Ollama

Verify installation:

```powershell
ollama --version
```

Install model:

```powershell
ollama pull qwen3:0.6b
```

Verify:

```powershell
ollama list
```

Expected:

```text
qwen3:0.6b
```

---

# Environment Variables

Create a `.env` file in the project root.

```env
TAVILY_API_KEY=your_tavily_api_key
```

---

# Run the Project

The project starts **both React and FastAPI** with one command.

```powershell
npm run dev
```

This launches:

| Service | URL |
|---------|-----|
| Frontend | http://localhost:5173 |
| Backend | http://127.0.0.1:8000 |

If 5173 is occupied, Vite automatically uses 5174.

---

# API Endpoints

## Health Check

```http
GET /health
```

Response

```json
{
  "status":"ok"
}
```

## Ask Question

```http
POST /ask
```

Example

```json
{
  "question":"What is Section 69A of the IT Act?",
  "session_id":"demo",
  "history":[]
}
```

## Sessions

```http
GET    /sessions
PATCH  /sessions/{id}
DELETE /sessions/{id}
```

## History

```http
GET /history/{session_id}
```

---

# Build the Vector Database

If new PDFs are added to the `data` folder:

```powershell
python build_db.py
```

This will:

1. Load PDFs
2. Split into chunks
3. Generate embeddings
4. Store vectors in ChromaDB

---

# Supported Legal Topics

- Company Registration
- Private Limited Company
- LLP
- GST
- Income Tax
- Startup India (DPIIT)
- FEMA
- SEBI
- Intellectual Property
- Trademark
- Copyright
- Employment Law
- Data Protection (DPDP)
- Contracts
- ESOPs
- Funding & Investment

---

# Example Questions

- What is DPIIT startup recognition?
- How do I register a private limited company in India?
- What is Section 69A of the Information Technology Act?
- What are GST compliance requirements for startups?
- What documents are required for angel funding?
- What is the DPDP Act?

---

# Security

Never commit:

```text
.env
venv/
node_modules/
__pycache__/
*.pyc
```

Store the Tavily API key only inside `.env`.

---

# Limitations

- Uses a lightweight local LLM (Qwen3 0.6B)
- Responses depend on retrieved documents
- Current legal information depends on Tavily results
- Should not replace professional legal advice

---

# Future Improvements

- Better reranking
- Stronger local LLM
- Source citations in UI
- PostgreSQL support
- Authentication
- Conversation memory
- Confidence scoring

---

# License

This project is intended for educational and research purposes. Add an appropriate open-source license before public distribution.