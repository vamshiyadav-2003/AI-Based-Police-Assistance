from sqlalchemy import Column, Integer, String, DateTime, Boolean, func
from app.core.database import Base


class Officer(Base):
    __tablename__ = "officers"

    id = Column(Integer, primary_key=True, index=True)
    badge_number = Column(String(50), unique=True, index=True, nullable=False)
    full_name = Column(String(150), nullable=False)
    email = Column(String(150), unique=True, nullable=True)
    hashed_password = Column(String(255), nullable=False)
    role = Column(String(30), nullable=False, default="officer")  # officer | station_head | admin
    station = Column(String(150), nullable=True)
    rank = Column("rank", String(50), quote=True, nullable=True)
    state = Column(String(100), nullable=True)
    district = Column(String(100), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    otp_code = Column(String(10), nullable=True)
    is_verified = Column(Boolean, default=False)

