from sqlalchemy import Column, Integer, String, DateTime
from app.core.database import Base


class MissingPerson(Base):
    __tablename__ = "missing_persons"

    id = Column(Integer, primary_key=True, index=True)
    missing_id = Column(String(50), unique=True, index=True, nullable=True)
    name = Column(String(150), nullable=False)
    age = Column(Integer, nullable=False)
    gender = Column(String(20), nullable=True)
    photo_url = Column(String(255), nullable=True)
    last_seen = Column(String(255), nullable=True)
    location = Column(String(150), nullable=True)  # Last seen location / city / district
    missing_date = Column(DateTime, nullable=True)
    status = Column(String(50), default="Missing")
