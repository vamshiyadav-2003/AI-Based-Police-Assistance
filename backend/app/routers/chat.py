from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_officer
from app.models.chat import ChatMessage
from app.models.user import Officer
from app.schemas.chat import ChatRequest, ChatResponse
from app.services.chat_service import get_chat_reply

router = APIRouter(prefix="/chat", tags=["chat"])


@router.post("/", response_model=ChatResponse)
def chat(
    payload: ChatRequest,
    db: Session = Depends(get_db),
    officer: Officer = Depends(get_current_officer),
):
    # Pull recent history for this officer so the assistant has conversational context
    recent = (
        db.query(ChatMessage)
        .filter(ChatMessage.officer_id == officer.id)
        .order_by(ChatMessage.created_at.desc())
        .limit(10)
        .all()
    )
    history = [{"role": m.role, "content": m.content} for m in reversed(recent)]

    reply = get_chat_reply(payload.message, history=history)

    db.add(ChatMessage(officer_id=officer.id, role="user", content=payload.message))
    db.add(ChatMessage(officer_id=officer.id, role="assistant", content=reply))
    db.commit()

    return ChatResponse(reply=reply)


@router.get("/history")
def chat_history(
    db: Session = Depends(get_db),
    officer: Officer = Depends(get_current_officer),
):
    messages = (
        db.query(ChatMessage)
        .filter(ChatMessage.officer_id == officer.id)
        .order_by(ChatMessage.created_at.asc())
        .all()
    )
    return [{"role": m.role, "content": m.content, "created_at": m.created_at} for m in messages]
