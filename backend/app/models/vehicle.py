from sqlalchemy import Column, Integer, String
from app.core.database import Base


class VehicleRecord(Base):
    __tablename__ = "raw_vehicle_records"

    vehicle_number = Column(String(50), primary_key=True, index=True)
    owner_name = Column(String(150), nullable=False)
    vehicle_type = Column(String(50), nullable=True)
    registration_date = Column(String(50), nullable=True)
    district = Column(String(100), nullable=True)
    previous_complaints = Column(Integer, default=0)
    status = Column(String(50), nullable=True)
