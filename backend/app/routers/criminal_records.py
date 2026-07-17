from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel

from app.core.database import get_db
from app.core.security import get_current_officer, require_role
from app.models.user import Officer
from app.models.criminal import CriminalRecord
from app.models.vehicle import VehicleRecord

router = APIRouter(prefix="/criminals", tags=["criminals"])


class CriminalCreateUpdate(BaseModel):
    name: str
    age: int
    gender: Optional[str] = None
    aadhaar: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    district: Optional[str] = None
    previous_firs: int = 0
    arrest_history: Optional[str] = None
    status: Optional[str] = None


@router.get("/search")
def search_criminals(
    query: Optional[str] = None,
    name: Optional[str] = None,
    aadhaar: Optional[str] = None,
    phone: Optional[str] = None,
    vehicle_number: Optional[str] = None,
    db: Session = Depends(get_db),
    _officer: Officer = Depends(get_current_officer),
):
    """Searches criminal records by name, aadhaar, phone, or vehicle number."""
    results = db.query(CriminalRecord)

    # 1. If searching by vehicle number, find the owner's name first
    if vehicle_number:
        veh = db.query(VehicleRecord).filter(VehicleRecord.vehicle_number == vehicle_number.strip().upper()).first()
        if veh:
            # Search for the owner name in criminal records
            results = results.filter(CriminalRecord.name.ilike(f"%{veh.owner_name}%"))
        else:
            return []

    # 2. Apply general search query across multiple fields
    elif query:
        q = f"%{query}%"
        results = results.filter(
            CriminalRecord.name.ilike(q)
            | CriminalRecord.aadhaar.ilike(q)
            | CriminalRecord.phone.like(q)
            | CriminalRecord.address.ilike(q)
            | CriminalRecord.district.ilike(q)
        )

    # 3. Apply specific filters
    else:
        if name:
            results = results.filter(CriminalRecord.name.ilike(f"%{name}%"))
        if aadhaar:
            results = results.filter(CriminalRecord.aadhaar.ilike(f"%{aadhaar}%"))
        if phone:
            results = results.filter(CriminalRecord.phone.like(f"%{phone}%"))

    return results.order_by(CriminalRecord.name.asc()).limit(50).all()


@router.post("/", status_code=status.HTTP_201_CREATED)
def create_criminal_record(
    payload: CriminalCreateUpdate,
    db: Session = Depends(get_db),
    _admin: Officer = Depends(require_role("admin")),
):
    """Allows administrators to create a new criminal record."""
    # Generate a unique criminal ID
    last_record = db.query(CriminalRecord).order_by(CriminalRecord.criminal_id.desc()).first()
    next_id_num = 1
    if last_record and last_record.criminal_id.startswith("CR"):
        try:
            next_id_num = int(last_record.criminal_id[2:]) + 1
        except ValueError:
            pass
    criminal_id = f"CR{next_id_num:04d}"

    criminal = CriminalRecord(
        criminal_id=criminal_id,
        name=payload.name,
        age=payload.age,
        gender=payload.gender,
        aadhaar=payload.aadhaar,
        phone=payload.phone,
        address=payload.address,
        district=payload.district,
        previous_firs=payload.previous_firs,
        arrest_history=payload.arrest_history,
        status=payload.status or "Active",
    )
    db.add(criminal)
    db.commit()
    db.refresh(criminal)
    return criminal


@router.put("/{criminal_id}")
def update_criminal_record(
    criminal_id: str,
    payload: CriminalCreateUpdate,
    db: Session = Depends(get_db),
    _admin: Officer = Depends(require_role("admin")),
):
    """Allows administrators to update an existing criminal record."""
    criminal = db.query(CriminalRecord).filter(CriminalRecord.criminal_id == criminal_id).first()
    if not criminal:
        raise HTTPException(status_code=404, detail="Criminal record not found")

    criminal.name = payload.name
    criminal.age = payload.age
    criminal.gender = payload.gender
    criminal.aadhaar = payload.aadhaar
    criminal.phone = payload.phone
    criminal.address = payload.address
    criminal.district = payload.district
    criminal.previous_firs = payload.previous_firs
    criminal.arrest_history = payload.arrest_history
    criminal.status = payload.status

    db.add(criminal)
    db.commit()
    db.refresh(criminal)
    return criminal


@router.delete("/{criminal_id}")
def delete_criminal_record(
    criminal_id: str,
    db: Session = Depends(get_db),
    _admin: Officer = Depends(require_role("admin")),
):
    """Allows administrators to delete a criminal record."""
    criminal = db.query(CriminalRecord).filter(CriminalRecord.criminal_id == criminal_id).first()
    if not criminal:
        raise HTTPException(status_code=404, detail="Criminal record not found")

    db.delete(criminal)
    db.commit()
    return {"status": "ok", "message": f"Deleted criminal record {criminal_id}"}
