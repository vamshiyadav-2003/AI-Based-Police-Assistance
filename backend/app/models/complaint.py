from sqlalchemy import Column, String, Text, BigInteger, Integer
from app.core.database import Base


class Complaint(Base):
    __tablename__ = "raw_complaints"

    complaint_id = Column(String(50), primary_key=True, index=True)
    citizen_name = Column(String(150), nullable=False)
    phone = Column(BigInteger, nullable=True)
    aadhaar = Column(String(50), nullable=True)
    complaint = Column(Text, nullable=False)
    ai_classification = Column(String(100), nullable=True)
    priority = Column(String(30), nullable=True)
    department = Column(String(100), nullable=True)
    date = Column(String(50), nullable=True)
    status = Column(String(50), nullable=True)
    assigned_officer_id = Column(Integer, nullable=True)

