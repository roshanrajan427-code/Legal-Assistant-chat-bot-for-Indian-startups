from pathlib import Path

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

engine = create_engine(
    f"sqlite:///{(Path(__file__).resolve().parent / 'chat.db').as_posix()}",
    connect_args={"check_same_thread": False}
)

SessionLocal = sessionmaker(bind=engine)
Base = declarative_base()
