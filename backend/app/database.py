import os
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from pathlib import Path

if os.getenv("IN_DOCKER"):
    # Running inside Docker container
    DATABASE_FILE = Path("/app/data/sql_app.db")
else:
    # Running locally
    DATABASE_FILE = Path(__file__).resolve().parent.parent.parent / "data" / "sql_app.db"

DATABASE_FILE.parent.mkdir(parents=True, exist_ok=True)

SQLALCHEMY_DATABASE_URL = os.getenv("DATABASE_URL", f"sqlite:///{DATABASE_FILE}")

engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()