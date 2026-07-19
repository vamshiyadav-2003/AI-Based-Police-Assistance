from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

from app.core.config import settings

# NOTE: This connects to YOUR existing PostgreSQL database via DATABASE_URL in .env
# If your DB already has tables, Base.metadata.create_all() below will only ADD
# tables that don't exist yet (it never drops or alters existing ones).
db_url = settings.DATABASE_URL or "sqlite:///./police.db"
if db_url.startswith("postgres://"):
    db_url = db_url.replace("postgres://", "postgresql://", 1)

if db_url.startswith("sqlite"):
    engine = create_engine(db_url, connect_args={"check_same_thread": False})
else:
    engine = create_engine(db_url, pool_pre_ping=True)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
