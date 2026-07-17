from sqlalchemy import Column, Integer, String, DateTime, Text, ForeignKey, func
from sqlalchemy.orm import relationship
from app.core.database import Base


class Case(Base):
    __tablename__ = "cases"

    id = Column(Integer, primary_key=True, index=True)
    fir_number = Column(String(50), unique=True, index=True, nullable=True)
    crime_type = Column(String(100), nullable=False, index=True)
    status = Column(String(30), default="new", index=True)  # new | investigating | chargesheet | closed
    complainant_name = Column(String(150), nullable=True)
    complainant_contact = Column(String(50), nullable=True)
    location = Column(String(255), nullable=True)
    incident_date = Column(DateTime(timezone=True), nullable=True)
    description = Column(Text, nullable=True)
    vehicle_involved = Column(String(100), nullable=True)

    assigned_officer_id = Column(Integer, ForeignKey("officers.id"), nullable=True)
    assigned_officer = relationship("Officer")

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    updates = relationship("CaseUpdate", back_populates="case", cascade="all, delete-orphan")


class CaseUpdate(Base):
    """Timeline log of actions/notes on a case."""
    __tablename__ = "case_updates"

    id = Column(Integer, primary_key=True, index=True)
    case_id = Column(Integer, ForeignKey("cases.id"), nullable=False)
    note = Column(Text, nullable=False)
    created_by_id = Column(Integer, ForeignKey("officers.id"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    case = relationship("Case", back_populates="updates")
