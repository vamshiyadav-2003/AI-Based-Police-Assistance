from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_officer
from app.models.user import Officer
from app.models.vehicle import VehicleRecord

router = APIRouter(prefix="/vehicles", tags=["vehicles"])


@router.get("/verify/{vehicle_number}")
def verify_vehicle(
    vehicle_number: str,
    db: Session = Depends(get_db),
    _officer: Officer = Depends(get_current_officer),
):
    """Verifies vehicle ownership and background complaints by vehicle number."""
    # Clean the input plate number
    clean_plate = vehicle_number.strip().upper().replace(" ", "")

    vehicle = db.query(VehicleRecord).filter(VehicleRecord.vehicle_number == clean_plate).first()
    if not vehicle:
        raise HTTPException(status_code=404, detail="Vehicle record not found")

    return {
        "vehicle_number": vehicle.vehicle_number,
        "owner_name": vehicle.owner_name,
        "vehicle_type": vehicle.vehicle_type,
        "registration_date": vehicle.registration_date,
        "district": vehicle.district,
        "previous_complaints": vehicle.previous_complaints,
        "status": vehicle.status,
    }
