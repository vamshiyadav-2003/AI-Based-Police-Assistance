from pydantic import BaseModel
from typing import Optional


class OfficerCreate(BaseModel):
    badge_number: str
    full_name: str
    email: Optional[str] = None
    password: str
    role: str = "officer"
    station: Optional[str] = None
    rank: Optional[str] = None
    state: Optional[str] = None
    district: Optional[str] = None


class OfficerOut(BaseModel):
    id: int
    badge_number: str
    full_name: str
    email: Optional[str] = None
    role: str
    station: Optional[str] = None
    rank: Optional[str] = None
    state: Optional[str] = None
    district: Optional[str] = None

    class Config:
        from_attributes = True


class Token(BaseModel):
    access_token: Optional[str] = None
    token_type: str = "bearer"
    status: str = "success"
    message: Optional[str] = None
    badge_number: Optional[str] = None
    email: Optional[str] = None


class LoginRequest(BaseModel):
    badge_number: str
    password: str
