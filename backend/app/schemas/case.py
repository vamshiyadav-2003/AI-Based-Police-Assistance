from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class CaseCreate(BaseModel):
    fir_number: Optional[str] = None
    crime_type: str
    complainant_name: Optional[str] = None
    complainant_contact: Optional[str] = None
    location: Optional[str] = None
    incident_date: Optional[datetime] = None
    description: Optional[str] = None
    vehicle_involved: Optional[str] = None


class CaseUpdateStatus(BaseModel):
    status: str
    note: Optional[str] = None


class CaseOut(BaseModel):
    id: int
    fir_number: Optional[str]
    crime_type: str
    status: str
    complainant_name: Optional[str]
    location: Optional[str]
    incident_date: Optional[datetime]
    description: Optional[str]
    vehicle_involved: Optional[str]
    assigned_officer_id: Optional[int]
    created_at: datetime

    class Config:
        from_attributes = True
