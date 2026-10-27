from datetime import datetime

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from sqlalchemy import text

from database import SessionLocal, engine, Base
from models import Chat, SessionMeta
from app import stream_answer

Base.metadata.create_all(bind=engine)

def ensure_schema():
    with engine.begin() as connection:
        session_columns = {
            row[1] for row in connection.execute(text("PRAGMA table_info(sessions_meta)"))
        }
        chat_columns = {
            row[1] for row in connection.execute(text("PRAGMA table_info(chats)"))
        }

        if "created_at" not in session_columns:
            connection.execute(text("ALTER TABLE sessions_meta ADD COLUMN created_at DATETIME"))
            connection.execute(text("UPDATE sessions_meta SET created_at = CURRENT_TIMESTAMP WHERE created_at IS NULL"))

        if "updated_at" not in session_columns:
            connection.execute(text("ALTER TABLE sessions_meta ADD COLUMN updated_at DATETIME"))
            connection.execute(text("UPDATE sessions_meta SET updated_at = CURRENT_TIMESTAMP WHERE updated_at IS NULL"))

        if "created_at" not in chat_columns:
            connection.execute(text("ALTER TABLE chats ADD COLUMN created_at DATETIME"))
            connection.execute(text("UPDATE chats SET created_at = CURRENT_TIMESTAMP WHERE created_at IS NULL"))

ensure_schema()

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

class Query(BaseModel):
    question: str
    session_id: str
    history: list = Field(default_factory=list)

class SessionUpdate(BaseModel):
    title: str

@app.post("/ask")
def ask(q: Query):
    db = SessionLocal()

    # create session
    session = db.query(SessionMeta)\
        .filter(SessionMeta.session_id == q.session_id)\
        .first()

    if not session:
        db.add(SessionMeta(
            session_id=q.session_id,
            title=q.question[:40],
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        ))
        db.commit()
    else:
        session.updated_at = datetime.utcnow()
        db.commit()

    # save user message
    db.add(Chat(
        session_id=q.session_id,
        role="user",
        content=q.question
    ))
    db.commit()

    # 🔥 STREAM RESPONSE
    def generator():
        full_text = ""

        for chunk in stream_answer(q.question, q.history):
            full_text += chunk
            yield chunk

        # save assistant response AFTER streaming
        db.add(Chat(
            session_id=q.session_id,
            role="assistant",
            content=full_text
        ))
        session = db.query(SessionMeta)\
            .filter(SessionMeta.session_id == q.session_id)\
            .first()
        if session:
            session.updated_at = datetime.utcnow()
        db.commit()

    return StreamingResponse(generator(), media_type="text/plain")


@app.get("/history/{session_id}")
def history(session_id: str):
    db = SessionLocal()
    chats = db.query(Chat)\
        .filter(Chat.session_id == session_id)\
        .order_by(Chat.id.asc())\
        .all()

    return [
        {"role": c.role, "content": c.content, "created_at": c.created_at.isoformat() if c.created_at else None}
        for c in chats
    ]


@app.get("/sessions")
def sessions():
    db = SessionLocal()
    data = db.query(SessionMeta).order_by(SessionMeta.updated_at.desc(), SessionMeta.id.desc()).all()

    return [
        {
            "session_id": s.session_id,
            "title": s.title,
            "created_at": s.created_at.isoformat() if s.created_at else None,
            "updated_at": s.updated_at.isoformat() if s.updated_at else None,
        }
        for s in data
    ]

@app.patch("/sessions/{session_id}")
def rename_session(session_id: str, payload: SessionUpdate):
    title = payload.title.strip()
    if not title:
        raise HTTPException(status_code=400, detail="Title cannot be empty")

    db = SessionLocal()
    session = db.query(SessionMeta)\
        .filter(SessionMeta.session_id == session_id)\
        .first()

    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    session.title = title[:80]
    session.updated_at = datetime.utcnow()
    db.commit()

    return {
        "session_id": session.session_id,
        "title": session.title,
        "created_at": session.created_at.isoformat() if session.created_at else None,
        "updated_at": session.updated_at.isoformat() if session.updated_at else None,
    }

@app.delete("/sessions/{session_id}")
def delete_session(session_id: str):
    db = SessionLocal()
    session = db.query(SessionMeta)\
        .filter(SessionMeta.session_id == session_id)\
        .first()

    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    db.query(Chat).filter(Chat.session_id == session_id).delete()
    db.delete(session)
    db.commit()

    return {"ok": True}

@app.delete("/sessions")
def delete_all_sessions():
    db = SessionLocal()
    db.query(Chat).delete()
    db.query(SessionMeta).delete()
    db.commit()

    return {"ok": True}

@app.get("/health")
def health():
    return {"status": "ok"}

@app.get("/")
def home():
    return {"message": "RAG API is running"}
