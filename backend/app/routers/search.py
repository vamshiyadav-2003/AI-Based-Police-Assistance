from pydantic import BaseModel
from typing import Optional
from fastapi import APIRouter, Depends

from app.core.security import get_current_officer
from app.models.user import Officer
from app.services.search_service import answer_with_rag

router = APIRouter(prefix="/search", tags=["search"])


class SearchRequest(BaseModel):
    query: str
    crime_type: Optional[str] = None  # optional metadata filter


@router.post("/")
def search_cases(
    payload: SearchRequest,
    officer: Officer = Depends(get_current_officer),
):
    """Natural-language case search, e.g. 'Show all robbery cases involving motorcycles'."""
    where = {"crime_type": payload.crime_type} if payload.crime_type else None
    return answer_with_rag(payload.query, where=where)
