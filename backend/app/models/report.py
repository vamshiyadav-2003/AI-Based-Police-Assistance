from sqlalchemy import Column, Integer, String, Text
from app.core.database import Base


class Report(Base):
    __tablename__ = "raw_reports"

    report_id = Column(String(50), primary_key=True, index=True)
    report_type = Column(String(50), nullable=False)
    generated_by = Column(String(100), nullable=True)
    report_date = Column(String(50), nullable=True)
    cases_covered = Column(Integer, default=0)
    summary = Column(Text, nullable=True)
