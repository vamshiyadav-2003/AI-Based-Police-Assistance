from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import text, func
from pydantic import BaseModel
from typing import Dict, List, Optional
from app.core.database import get_db
from app.core.security import require_role
from app.models.user import Officer
from app.models.complaint import Complaint
from app.models.chat import ChatMessage
from app.services.fir_service import get_fir_prompt, update_fir_prompt
from app.core.config import settings

router = APIRouter(prefix="/admin", tags=["admin"])


class PromptUpdate(BaseModel):
    prompt: str


class RoleUpdate(BaseModel):
    role: str


class PasswordUpdate(BaseModel):
    password: str


class ComplaintAssignRequest(BaseModel):
    assigned_officer_id: int


class ComplaintStatusRequest(BaseModel):
    status: str


class ComplaintApproveRequest(BaseModel):
    assigned_officer_id: int
    fir_number: str
    incident_location: Optional[str] = None


class ToggleFeatureRequest(BaseModel):
    feature: str
    enabled: bool


# Mock feature states in memory
FEATURE_STATES = {
    "fir_generator": True,
    "chat_assistant": True,
    "complaint_classification": True,
    "evidence_summarizer": True,
    "reports_generator": True,
    "criminal_search": True,
}


@router.get("/stats")
def get_admin_dashboard_stats(
    db: Session = Depends(get_db),
    _admin: Officer = Depends(require_role("admin")),
):
    """Returns specialized metrics for the administrative console."""
    # 1. Total registered users (officers count in database)
    total_users = db.query(Officer).count()
    
    # 2. Active complaints (status is not Closed/empty)
    active_complaints = db.query(Complaint).filter(
        func.coalesce(Complaint.status, "").ilike("closed") == False
    ).count()

    # 3. Pending reviews (status is Pending)
    pending_reviews = db.query(Complaint).filter(
        func.coalesce(Complaint.status, "").ilike("pending") == True
    ).count()

    # 4. AI Requests Today (assistant ChatMessage count)
    ai_requests_today = db.query(ChatMessage).filter(
        ChatMessage.role == "assistant"
    ).count()

    # 5. LangSmith Traces (total ChatMessage logs count)
    langsmith_traces = db.query(ChatMessage).count()

    # 6. Emergency Alerts (high/critical/emergency priority complaints)
    emergency_alerts = db.query(Complaint).filter(
        func.coalesce(Complaint.priority, "").ilike("high") | 
        func.coalesce(Complaint.priority, "").ilike("critical") | 
        func.coalesce(Complaint.priority, "").ilike("emergency")
    ).count()

    # 7. Groq Status (Online if api key is configured, Offline otherwise)
    groq_status = "Online" if settings.GROQ_API_KEY else "Offline"

    # 8. System Health
    system_health = "Healthy" if groq_status == "Online" else "Degraded"

    return {
        "total_users": total_users,
        "active_complaints": active_complaints,
        "ai_requests_today": ai_requests_today,
        "groq_status": groq_status,
        "langsmith_traces": langsmith_traces,
        "pending_reviews": pending_reviews,
        "emergency_alerts": emergency_alerts,
        "system_health": system_health,
    }


@router.get("/prompt")
def get_prompt(
    _admin: Officer = Depends(require_role("admin")),
):
    """Returns the current system prompt template."""
    return {"prompt": get_fir_prompt()}


@router.post("/prompt")
def update_prompt(
    payload: PromptUpdate,
    _admin: Officer = Depends(require_role("admin")),
):
    """Updates the dynamic FIR assistant prompt template."""
    try:
        update_fir_prompt(payload.prompt)
        return {"status": "success", "message": "FIR System prompt updated successfully."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to update prompt: {str(e)}")


@router.get("/chat-history")
def get_chat_history(
    limit: int = 100,
    db: Session = Depends(get_db),
    _admin: Officer = Depends(require_role("admin")),
):
    """Returns system-wide assistant chat history logs."""
    history = db.query(ChatMessage).order_by(ChatMessage.created_at.desc()).limit(limit).all()
    return [
        {
            "id": msg.id,
            "officer_id": msg.officer_id,
            "role": msg.role,
            "content": msg.content,
            "created_at": msg.created_at,
        }
        for msg in history
    ]


@router.get("/citizens")
def get_citizens(
    db: Session = Depends(get_db),
    _admin: Officer = Depends(require_role("admin")),
):
    """Returns citizen profiles extracted from raw complaints database."""
    # Group by name/phone/aadhaar to find unique citizens
    results = db.query(
        Complaint.citizen_name, 
        Complaint.phone, 
        Complaint.aadhaar,
        func.max(Complaint.complaint_id).label("latest_complaint_id")
    ).group_by(Complaint.citizen_name, Complaint.phone, Complaint.aadhaar).all()

    citizens = []
    for idx, r in enumerate(results):
        citizens.append({
            "id": idx + 1,
            "name": r.citizen_name,
            "phone": str(r.phone) if r.phone else "N/A",
            "aadhaar": r.aadhaar if r.aadhaar else "N/A",
            "role": "Citizen",
            "latest_complaint_id": r.latest_complaint_id
        })

    return citizens


@router.patch("/users/{user_id}/role")
def update_user_role(
    user_id: int,
    payload: RoleUpdate,
    db: Session = Depends(get_db),
    admin: Officer = Depends(require_role("admin")),
):
    """Allows administrators to change user roles dynamically."""
    if user_id == admin.id:
        raise HTTPException(status_code=400, detail="Cannot modify your own administrator role.")

    officer = db.query(Officer).filter(Officer.id == user_id).first()
    if not officer:
        raise HTTPException(status_code=404, detail="User not found")

    officer.role = payload.role
    db.commit()
    return {"status": "ok", "message": f"Updated {officer.full_name}'s role to {payload.role}"}


@router.patch("/users/{user_id}/password")
def change_user_password(
    user_id: int,
    payload: PasswordUpdate,
    db: Session = Depends(get_db),
    _admin: Officer = Depends(require_role("admin")),
):
    """Allows administrators to reset user passwords."""
    from app.core.security import hash_password
    officer = db.query(Officer).filter(Officer.id == user_id).first()
    if not officer:
        raise HTTPException(status_code=404, detail="User not found")

    officer.hashed_password = hash_password(payload.password)
    db.commit()
    return {"status": "ok", "message": f"Password reset successfully for {officer.full_name}."}


@router.patch("/complaints/{complaint_id}/assign")
def assign_complaint(
    complaint_id: str,
    payload: ComplaintAssignRequest,
    db: Session = Depends(get_db),
    _admin: Officer = Depends(require_role("admin")),
):
    """Assigns a raw complaint to a specific police officer."""
    complaint = db.query(Complaint).filter(Complaint.complaint_id == complaint_id).first()
    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint not found")

    officer = db.query(Officer).filter(Officer.id == payload.assigned_officer_id).first()
    if not officer:
        raise HTTPException(status_code=404, detail="Assigned officer not found")

    complaint.assigned_officer_id = payload.assigned_officer_id
    db.commit()
    return {"status": "ok", "message": f"Complaint {complaint_id} assigned to {officer.full_name}."}


@router.patch("/complaints/{complaint_id}/status")
def update_complaint_status(
    complaint_id: str,
    payload: ComplaintStatusRequest,
    db: Session = Depends(get_db),
    _admin: Officer = Depends(require_role("admin")),
):
    """Updates the status of a raw complaint (Pending, In Progress, Closed)."""
    complaint = db.query(Complaint).filter(Complaint.complaint_id == complaint_id).first()
    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint not found")

    complaint.status = payload.status
    db.commit()
    return {"status": "ok", "message": f"Complaint {complaint_id} status updated to {payload.status}."}


@router.post("/complaints/{complaint_id}/approve")
def approve_complaint(
    complaint_id: str,
    payload: ComplaintApproveRequest,
    db: Session = Depends(get_db),
    _admin: Officer = Depends(require_role("admin")),
):
    """Approves a citizen complaint, updates its status/assignment, and registers a Case."""
    from datetime import datetime
    from app.models.case import Case
    from app.services.search_service import index_case

    # 1. Fetch complaint
    complaint = db.query(Complaint).filter(Complaint.complaint_id == complaint_id).first()
    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint not found")

    if complaint.status == "Approved":
        raise HTTPException(status_code=400, detail="Complaint is already approved")

    # 2. Verify officer exists
    officer = db.query(Officer).filter(Officer.id == payload.assigned_officer_id).first()
    if not officer:
        raise HTTPException(status_code=404, detail="Assigned officer not found")

    # 3. Check for unique fir_number if provided to avoid conflicts
    if payload.fir_number:
        existing_case = db.query(Case).filter(Case.fir_number == payload.fir_number).first()
        if existing_case:
            raise HTTPException(status_code=400, detail=f"A case with FIR number {payload.fir_number} already exists.")

    # 4. Parse date
    parsed_date = None
    if complaint.date:
        for fmt in ("%Y-%m-%d", "%Y-%m-%d %H:%M:%S", "%d-%m-%Y"):
            try:
                parsed_date = datetime.strptime(complaint.date.strip(), fmt)
                break
            except ValueError:
                continue

    # 5. Create new Case
    new_case = Case(
        fir_number=payload.fir_number,
        crime_type=complaint.ai_classification or "Other",
        status="new",
        complainant_name=complaint.citizen_name,
        complainant_contact=str(complaint.phone) if complaint.phone else "",
        location=payload.incident_location or "Unknown",
        incident_date=parsed_date,
        description=complaint.complaint,
        assigned_officer_id=payload.assigned_officer_id,
    )
    db.add(new_case)
    db.flush()

    # 6. Update complaint status
    complaint.status = "Approved"
    complaint.assigned_officer_id = payload.assigned_officer_id

    db.commit()
    db.refresh(new_case)

    # 7. Index in ChromaDB
    try:
        index_case(
            new_case.id,
            new_case.description or "",
            metadata={
                "crime_type": new_case.crime_type or "",
                "location": new_case.location or "",
                "vehicle_involved": "",
                "status": new_case.status,
            },
        )
    except Exception as e:
        print(f"Notice: Indexing case in search service failed: {e}")

    return {
        "status": "success",
        "message": f"Complaint {complaint_id} approved. Case {new_case.id} (FIR: {new_case.fir_number}) registered & assigned.",
        "case_id": new_case.id,
        "fir_number": new_case.fir_number,
    }


@router.post("/complaints/{complaint_id}/reject")
def reject_complaint(
    complaint_id: str,
    db: Session = Depends(get_db),
    _admin: Officer = Depends(require_role("admin")),
):
    """Rejects a citizen complaint and marks it as Rejected."""
    complaint = db.query(Complaint).filter(Complaint.complaint_id == complaint_id).first()
    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint not found")

    complaint.status = "Rejected"
    db.commit()
    return {"status": "success", "message": f"Complaint {complaint_id} has been rejected."}


@router.get("/features")
def get_features(
    _admin: Officer = Depends(require_role("admin")),
):
    """Returns in-memory toggled states of AI features."""
    return FEATURE_STATES


@router.post("/toggle-feature")
def toggle_feature(
    payload: ToggleFeatureRequest,
    _admin: Officer = Depends(require_role("admin")),
):
    """Enables or disables an AI capability in-memory."""
    if payload.feature in FEATURE_STATES:
        FEATURE_STATES[payload.feature] = payload.enabled
        return {"status": "ok", "feature": payload.feature, "enabled": payload.enabled}
    raise HTTPException(status_code=404, detail="Feature key not found")
