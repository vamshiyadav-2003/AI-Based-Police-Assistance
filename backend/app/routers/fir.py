from pydantic import BaseModel
from fastapi import APIRouter, Depends

from app.core.security import get_current_officer
from app.models.user import Officer
from app.services.fir_service import generate_fir_draft

router = APIRouter(prefix="/fir", tags=["fir"])


class FIRDraftRequest(BaseModel):
    complaint_text: str


@router.post("/draft")
def draft_fir(
    payload: FIRDraftRequest,
    officer: Officer = Depends(get_current_officer),
):
    """Takes raw complaint text (from voice transcription or typed input)
    and returns a structured FIR draft the officer can review/edit."""
    return generate_fir_draft(payload.complaint_text)
