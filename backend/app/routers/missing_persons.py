from typing import Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel

from app.core.database import get_db
from app.core.security import get_current_officer
from app.models.user import Officer
from app.models.missing_person import MissingPerson

router = APIRouter(prefix="/missing-persons", tags=["missing-persons"])


class MissingPersonCreate(BaseModel):
    name: str
    age: int
    gender: Optional[str] = None
    last_seen: Optional[str] = None
    location: Optional[str] = None  # city or district
    missing_date: Optional[str] = None  # format YYYY-MM-DD
    photo_url: Optional[str] = None
    status: Optional[str] = None


@router.get("/")
def search_missing_persons(
    name: Optional[str] = None,
    age: Optional[int] = None,
    city: Optional[str] = None,
    db: Session = Depends(get_db),
    _officer: Officer = Depends(get_current_officer),
):
    """Searches missing persons by name, age, or city/location."""
    query = db.query(MissingPerson)

    if name:
        query = query.filter(MissingPerson.name.ilike(f"%{name}%"))
    if age is not None:
        query = query.filter(MissingPerson.age == age)
    if city:
        query = query.filter(MissingPerson.location.ilike(f"%{city}%"))

    return query.order_by(MissingPerson.name.asc()).limit(50).all()


@router.post("/", status_code=status.HTTP_201_CREATED)
def create_missing_person(
    payload: MissingPersonCreate,
    db: Session = Depends(get_db),
    _officer: Officer = Depends(get_current_officer),
):
    """Allows officers to report a missing person."""
    # Generate missing ID
    last_record = db.query(MissingPerson).order_by(MissingPerson.id.desc()).first()
    next_id_num = (last_record.id + 1) if last_record else 1
    missing_id = f"MP{next_id_num:04d}"

    m_date = None
    if payload.missing_date:
        try:
            m_date = datetime.strptime(payload.missing_date, "%Y-%m-%d")
        except ValueError:
            pass

    # Provide a default avatar if photo_url is empty
    photo_url = payload.photo_url or f"https://ui-avatars.com/api/?name={payload.name.replace(' ', '+')}&background=1B2536&color=E8A33D"

    person = MissingPerson(
        missing_id=missing_id,
        name=payload.name,
        age=payload.age,
        gender=payload.gender,
        last_seen=payload.last_seen,
        location=payload.location,
        missing_date=m_date,
        photo_url=photo_url,
        status=payload.status or "Missing",
    )

    db.add(person)
    db.commit()
    db.refresh(person)
    return person
