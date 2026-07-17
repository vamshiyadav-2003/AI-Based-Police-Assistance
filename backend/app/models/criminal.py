from sqlalchemy import Column, Integer, String, Text
from app.core.database import Base


class CriminalRecord(Base):
    __tablename__ = "raw_criminal_records"

    criminal_id = Column(String(50), primary_key=True, index=True)
    name = Column(String(150), nullable=False)
    age = Column(Integer, nullable=False)
    gender = Column(String(20), nullable=True)
    aadhaar = Column(String(50), nullable=True)
    phone = Column(String(50), nullable=True)
    address = Column(Text, nullable=True)
    district = Column(String(100), nullable=True)
    previous_firs = Column(Integer, default=0)
    arrest_history = Column(Text, nullable=True)
    status = Column(String(50), nullable=True)
