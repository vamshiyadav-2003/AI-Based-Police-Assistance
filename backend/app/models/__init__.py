from app.core.database import Base
from app.models.user import Officer
from app.models.case import Case, CaseUpdate
from app.models.chat import ChatMessage
from app.models.missing_person import MissingPerson
from app.models.criminal import CriminalRecord
from app.models.vehicle import VehicleRecord
from app.models.complaint import Complaint
from app.models.report import Report
from app.models.otp import OTPRecord

__all__ = [
    "Base",
    "Officer",
    "Case",
    "CaseUpdate",
    "ChatMessage",
    "MissingPerson",
    "CriminalRecord",
    "VehicleRecord",
    "Complaint",
    "Report",
    "OTPRecord",
]
