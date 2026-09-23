# APPENDICES

## Appendix A: System Architecture

**Frontend**: React + Vite (TypeScript) & Streamlit UI  
**Backend**: FastAPI with async support, CORS, logging, Bugsnag error tracking  
**Database**: PostgreSQL with SQLAlchemy ORM  
**Vector Store**: ChromaDB for RAG embeddings (384-dim, sentence-transformers)  
**Real-time**: WebSockets for chat/notifications  
**Task Scheduler**: APScheduler for background jobs

**Core Components**:
- **RAG System** (retriever.py, generator.py, build_db.py): Document retrieval + LLM augmentation
- **Routes**: auth, chat, ai, code, task, course, user, file, org, cohort, milestone, scorecard, attendance, certificate, features, feedback, judge0, integrations
- **WebSocket**: Real-time chat, notifications, collaborative editing

---

## Appendix B: API Endpoints Quick Reference

| Route | Methods | Purpose |
|-------|---------|---------|
| `/auth` | POST | Login, register, refresh token |
| `/chat` | POST/GET | Messages, sessions |
| `/ai` | POST/GET | Generate, analyze, retrieve from KB |
| `/tasks` | CRUD | Task management & submission |
| `/courses` | CRUD | Course management |
| `/users` | CRUD | User management |
| `/code` | POST | Code execution & validation |
| `/file` | POST/GET/DELETE | File upload/download |
| `/organizations` | CRUD | Organization management |
| `/ws/chat/{id}` | WebSocket | Real-time messaging |
| `/health` | GET | Health check |

**Error Codes**: 200 (OK), 201 (Created), 204 (No Content), 400 (Bad Request), 401 (Unauthorized), 403 (Forbidden), 404 (Not Found), 422 (Validation), 500 (Server Error)

---

## Appendix C: Environment Setup & Dependencies

**Python Stack** (requirements.txt):
- Core: FastAPI, uvicorn, SQLAlchemy, alembic, psycopg2
- AI: langchain, chromadb, ollama, sentence-transformers, tavily-python
- Real-time: websockets, apscheduler
- Error tracking: bugsnag, python-dotenv

**Frontend Stack** (package.json):
- React, Vite, TypeScript, framer-motion, lucide-react, react-markdown, react-syntax-highlighter

**Required Environment Variables**:
```
DATABASE_URL=postgresql://user:pass@localhost/dbname
OLLAMA_API_URL=http://localhost:11434
TAVILY_API_KEY=your_key
BUGSNAG_API_KEY=optional
LOCAL_UPLOAD_FOLDER=./uploads
ENV=development|production
```

**Backend Setup**:
```bash
python -m venv venv && source venv/Scripts/activate
pip install -r requirements.txt
cp .env.example .env && python build_db.py
alembic upgrade head
uvicorn main:app --reload
```

**Frontend Setup**:
```bash
cd react-app && npm install
npm run dev  # development
npm run build  # production
```

---

## Appendix D: Database Schema & File Structure

**Core Tables**:
- Users: id, email, password_hash, organization_id, timestamps
- Organizations: id, name, timestamps
- Courses: id, organization_id, title, description, timestamps
- Tasks: id, course_id, title, description, due_date, timestamps
- ChatSessions: id, user_id, title, timestamps
- ChatMessages: id, session_id, user_id, content, role, timestamps
- ChromaDB: Document embeddings (384-dim) with metadata (source, date, category)

**Directory Structure**:
```
project y/
├── main.py, app.py, build_db.py, database.py, models.py
├── src/ (config.py, generator.py, retriever.py)
├── api/ (routes/{auth,chat,ai,code,task,...}, websockets, db, utils, config.py, settings.py, scheduler.py)
├── react-app/ (src/{components,lib,App.tsx,types.ts}, public, vite.config.ts)
├── data/ (RAG documents), chroma_db/, uploads/
├── requirements.txt, package.json, APPENDICES.md
```

---

## Appendix E: Middleware, Error Handling & Security

**Middleware Stack**:
1. Request Logging: Logs method, path, IP, duration, errors
2. CORS: Allow origins/credentials/methods/headers (restrict in production)
3. Bugsnag: Captures & sends unhandled exceptions

**Exception Handlers**:
- 422 (RequestValidationError): Returns field-level validation errors
- 4xx (HTTPException): Client errors (logged as INFO)
- 5xx (HTTPException): Server errors (logged as ERROR)
- 500 (Generic): Unhandled exceptions with safe message

**Security**:
- JWT tokens: Issued at /auth/login, renewed at /auth/refresh-token
- RBAC: Check permissions in route handlers, enforce org boundaries
- Validation: Pydantic models validate all inputs, ORM prevents SQL injection
- Rate limiting: Per IP/user via middleware, return 429
- Encryption: HTTPS/TLS, bcrypt password hashing, .env for secrets

---

## Appendix F: WebSocket & Real-time Communication

**Endpoints**:
- `ws://host/ws/chat/{session_id}`: Real-time chat
- `ws://host/ws/notifications/{user_id}`: Live notifications
- `ws://host/ws/collab/{room_id}`: Collaborative editing

**Message Formats**:
```json
{"type":"message", "content":"text", "session_id":"uuid", "timestamp":"ISO"}
{"type":"notification", "title":"title", "body":"body", "level":"info|warning|error"}
```

**Lifecycle**: Client initiates → Server validates session → OPEN → Bidirectional exchange → Close/timeout

---

## Appendix G: Integration & External Services

| Service | Purpose | Config |
|---------|---------|--------|
| Ollama | Local LLM inference | OLLAMA_API_URL env var |
| Tavily | Web search for RAG | TAVILY_API_KEY env var |
| Judge0 | Code execution/compilation | /code routes, 50+ languages |
| Sentence-Transformers | Document embeddings | all-MiniLM-L6-v2 (384-dim) |

---

## Appendix H: Deployment & Production Checklist

**Prerequisites**: Python 3.9+, Node.js 18+, PostgreSQL 12+, Docker (optional)

**Production Checklist**:
- Backend: ENV=production, restrict CORS, strong DB credentials, logging setup, Bugsnag enabled, HTTPS/TLS, rate limiting, auth tokens
- Frontend: Minified build, CDN caching, security headers, gzip compression

**Docker**:
```dockerfile
# Backend: Python 3.11 + FastAPI
# Frontend: Node build stage + nginx serve
```

**Common Commands**:
```bash
# Backend
uvicorn main:app --host 0.0.0.0 --port 8000
alembic upgrade head  # migrations
python build_db.py   # RAG init
pytest -v           # tests

# Frontend
npm run dev         # dev server
npm run build       # production build
npm run lint        # linting
```

---

## Appendix I: Performance & Monitoring

**Backend Optimization**:
- Database: Index frequent queries, connection pooling, query caching
- API: Async handling, pagination, gzip compression
- RAG: Cache embeddings, limit K-retrieval, query preprocessing
- Files: Stream uploads, enforce size limits, use CDN

**Frontend Optimization**:
- Code splitting, lazy loading, memoization
- Request debouncing, localStorage caching, WebSockets
- Minification, tree-shaking, Vite bundling

**Metrics to Monitor**: Response times, query performance, error rates, WebSocket connections, CPU/memory, page load time, bundle size, network requests

---

**Last Updated: April 28, 2026**
