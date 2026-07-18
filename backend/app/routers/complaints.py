import json
import os
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from langchain_groq import ChatGroq
from langchain_core.messages import SystemMessage, HumanMessage

from app.core.database import get_db
from app.core.security import get_current_officer
from app.core.config import settings
from app.models.user import Officer
from app.models.complaint import Complaint

router = APIRouter(prefix="/complaints", tags=["complaints"])


class ClassifyRequest(BaseModel):
    complaint_text: str


def get_classify_llm():
    lc_key = settings.LANGCHAIN_API_KEY_FIR or settings.LANGCHAIN_API_KEY
    if lc_key:
        os.environ["LANGCHAIN_API_KEY"] = lc_key
        os.environ["LANGCHAIN_TRACING_V2"] = "true"
    else:
        os.environ["LANGCHAIN_TRACING_V2"] = "false"
    return ChatGroq(
        api_key=settings.GROQ_API_KEY_FIR or settings.GROQ_API_KEY,
        model=settings.GROQ_MODEL,
        temperature=0.0,
    )


CLASSIFY_SYSTEM_PROMPT = """You are an AI classifier for police complaints.
Analyze the complaint and classify it into:
1. Category: (e.g. Theft, Cyber Crime, Assault, Fraud, Traffic Violation, Missing Person, Domestic Dispute, Harassment)
2. Priority: (High, Medium, Low)
3. Suggested Department: (e.g. Cyber Cell, Local Police Station, Traffic Police, Women Protection Cell, Crime Branch)

Respond ONLY with valid JSON matching this schema:
{
  "category": string,
  "priority": string,
  "suggested_department": string
}
Do not include any preamble, comments, or markdown formatting (such as ```json). Output exactly the JSON string.
"""


@router.get("/")
def list_complaints(
    priority: Optional[str] = None,
    category: Optional[str] = None,
    status: Optional[str] = None,
    limit: int = 50,
    offset: int = 0,
    db: Session = Depends(get_db),
    _officer: Officer = Depends(get_current_officer),
):
    """Returns a list of raw complaints for history/auditing purposes."""
    query = db.query(Complaint)
    if priority:
        query = query.filter(Complaint.priority == priority)
    if category:
        query = query.filter(Complaint.ai_classification == category)
    if status:
        query = query.filter(Complaint.status.ilike(status))

    total = query.count()
    items = query.order_by(Complaint.complaint_id.desc()).offset(offset).limit(limit).all()

    return {
        "total": total,
        "items": [
            {
                "complaint_id": item.complaint_id,
                "citizen_name": item.citizen_name,
                "phone": item.phone,
                "aadhaar": item.aadhaar,
                "complaint": item.complaint,
                "category": item.ai_classification,
                "priority": item.priority,
                "department": item.department,
                "date": item.date,
                "status": item.status,
            }
            for item in items
        ],
    }


class ComplaintCreate(BaseModel):
    complaint_id: str
    citizen_name: str
    phone: Optional[str] = None
    aadhaar: Optional[str] = None
    complaint: str
    category: Optional[str] = None
    priority: Optional[str] = None
    department: Optional[str] = None
    date: Optional[str] = None


@router.post("/")
def create_complaint(
    payload: ComplaintCreate,
    db: Session = Depends(get_db),
):
    # Safe conversion of phone string to integer for biginteger field
    phone_val = None
    if payload.phone:
        digits = "".join(c for c in payload.phone if c.isdigit())
        if digits:
            try:
                phone_val = int(digits)
            except:
                pass

    db_complaint = Complaint(
        complaint_id=payload.complaint_id,
        citizen_name=payload.citizen_name,
        phone=phone_val,
        aadhaar=payload.aadhaar,
        complaint=payload.complaint,
        ai_classification=payload.category,
        priority=payload.priority,
        department=payload.department,
        date=payload.date,
        status="Pending",
    )
    db.add(db_complaint)
    db.commit()
    db.refresh(db_complaint)
    return {"status": "success", "complaint_id": db_complaint.complaint_id}


@router.post("/classify")
def classify_complaint(
    payload: ClassifyRequest,
    _officer: Officer = Depends(get_current_officer),
):
    """Takes a raw complaint text and returns priority, category, and department recommendation."""
    messages = [
        SystemMessage(content=CLASSIFY_SYSTEM_PROMPT),
        HumanMessage(content=payload.complaint_text),
    ]

    llm = get_classify_llm()
    try:
        response = llm.invoke(messages)
        content = response.content.strip()

        # Defensive cleanup
        if content.startswith("```"):
            content = content.strip("`")
            if content.lower().startswith("json"):
                content = content[4:]

        result = json.loads(content)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI Classification failed: {str(e)}")
