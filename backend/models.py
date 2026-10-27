from datetime import datetime

from sqlalchemy import Column, DateTime, Integer, String, Text
from database import Base

class Chat(Base):
    __tablename__ = "chats"

    id = Column(Integer, primary_key=True)
    session_id = Column(String)
    role = Column(String)
    content = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)


class SessionMeta(Base):
    __tablename__ = "sessions_meta"

    id = Column(Integer, primary_key=True)
    session_id = Column(String, unique=True)
    title = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow)
