from typing import Optional
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_officer, require_role
from app.models.case import Case, CaseUpdate
from app.models.user import Officer
from app.schemas.case import CaseCreate, CaseOut, CaseUpdateStatus
from app.services.search_service import index_case

router = APIRouter(prefix="/cases", tags=["cases"])


@router.post("/", response_model=CaseOut)
def create_case(
    payload: CaseCreate,
    db: Session = Depends(get_db),
    officer: Officer = Depends(get_current_officer),
):
    case = Case(**payload.model_dump(), assigned_officer_id=officer.id)
    db.add(case)
    db.commit()
    db.refresh(case)

    # Make it searchable via semantic search immediately
    if case.description:
        index_case(
            case.id,
            case.description,
            metadata={
                "crime_type": case.crime_type or "",
                "location": case.location or "",
                "vehicle_involved": case.vehicle_involved or "",
                "status": case.status,
            },
        )

    return case


@router.get("/", response_model=list[CaseOut])
def list_cases(
    status_filter: Optional[str] = None,
    crime_type: Optional[str] = None,
    db: Session = Depends(get_db),
    officer: Officer = Depends(get_current_officer),
):
    query = db.query(Case)
    if status_filter:
        query = query.filter(Case.status == status_filter)
    if crime_type:
        query = query.filter(Case.crime_type == crime_type)
    return query.order_by(Case.created_at.desc()).all()


@router.get("/{case_id}", response_model=CaseOut)
def get_case(
    case_id: int,
    db: Session = Depends(get_db),
    officer: Officer = Depends(get_current_officer),
):
    case = db.query(Case).filter(Case.id == case_id).first()
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
    return case


@router.patch("/{case_id}/status", response_model=CaseOut)
def update_case_status(
    case_id: int,
    payload: CaseUpdateStatus,
    db: Session = Depends(get_db),
    officer: Officer = Depends(get_current_officer),
):
    case = db.query(Case).filter(Case.id == case_id).first()
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")

    case.status = payload.status
    db.add(case)

    if payload.note:
        update = CaseUpdate(case_id=case.id, note=payload.note, created_by_id=officer.id)
        db.add(update)

    db.commit()
    db.refresh(case)
    return case


from pydantic import BaseModel

class CaseAssignRequest(BaseModel):
    assigned_officer_id: int
    note: Optional[str] = None


@router.patch("/{case_id}/assign", response_model=CaseOut)
def assign_case(
    case_id: int,
    payload: CaseAssignRequest,
    db: Session = Depends(get_db),
    admin: Officer = Depends(require_role("admin", "station_head")),
):
    case = db.query(Case).filter(Case.id == case_id).first()
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")

    # Check if officer exists
    target_officer = db.query(Officer).filter(Officer.id == payload.assigned_officer_id).first()
    if not target_officer:
        raise HTTPException(status_code=404, detail="Officer not found")

    case.assigned_officer_id = payload.assigned_officer_id
    db.add(case)

    note_text = f"Case assigned to Officer {target_officer.full_name} (Badge: {target_officer.badge_number})."
    if payload.note:
        note_text += f" Note: {payload.note}"

    update = CaseUpdate(case_id=case.id, note=note_text, created_by_id=admin.id)
    db.add(update)

    db.commit()
    db.refresh(case)
    return case

