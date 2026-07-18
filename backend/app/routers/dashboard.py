from fastapi import APIRouter, Depends
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_officer
from app.models.user import Officer
from app.models.case import Case
from app.models.missing_person import MissingPerson
from app.models.criminal import CriminalRecord

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


@router.get("/stats")
def get_dashboard_stats(
    db: Session = Depends(get_db),
    _officer: Officer = Depends(get_current_officer),
):
    """Returns aggregate statistics for the dashboard/overview page."""
    total_cases = db.query(Case).count()
    solved_cases = db.query(Case).filter(Case.status == "closed").count()
    pending_cases = db.query(Case).filter(Case.status != "closed").count()
    missing_persons = db.query(MissingPerson).count()
    criminal_records = db.query(CriminalRecord).count()

    try:
        total_firs = db.execute(text("SELECT COUNT(*) FROM raw_fir_records")).scalar() or 0
    except Exception:
        total_firs = total_cases

    # Calculate emergency alerts count (high/critical/emergency complaints)
    try:
        from app.models.complaint import Complaint
        from sqlalchemy import func
        emergency_alerts = db.query(Complaint).filter(
            func.coalesce(Complaint.priority, "").ilike("high") | 
            func.coalesce(Complaint.priority, "").ilike("critical") | 
            func.coalesce(Complaint.priority, "").ilike("emergency")
        ).count()
    except Exception:
        emergency_alerts = 4

    return {
        "total_cases": total_cases,
        "solved_cases": solved_cases,
        "pending_cases": pending_cases,
        "total_firs": total_firs,
        "missing_persons": missing_persons,
        "criminal_records": criminal_records,
        "emergency_alerts": emergency_alerts,
    }

