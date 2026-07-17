from datetime import datetime, timedelta, timezone
import random
from typing import Optional
# pyrefly: ignore [missing-import]
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel

from app.core.database import get_db
from app.core.security import hash_password, verify_password, create_access_token, require_role
from app.models.user import Officer
from app.models.otp import OTPRecord
from app.schemas.user import OfficerCreate, OfficerOut, Token, LoginRequest
from app.services.email_service import send_otp_email, send_activation_email

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register")
def register_officer(payload: OfficerCreate, db: Session = Depends(get_db)):
    badge_upper = payload.badge_number.strip().upper()
    email_clean = payload.email.strip() if payload.email else ""
    
    if not email_clean:
        raise HTTPException(status_code=400, detail="Email is required for registration")
        
    # Check if a VERIFIED account already exists
    existing = db.query(Officer).filter(
        ((Officer.badge_number == badge_upper) | (Officer.email == email_clean)) &
        (Officer.is_verified == True)
    ).first()

    if existing:
        raise HTTPException(status_code=400, detail="Badge number or email already registered")

    # Generate OTP
    otp_code = f"{random.randint(100000, 999999)}"
    expires_at = datetime.now(timezone.utc) + timedelta(minutes=10)

    otp_record = OTPRecord(
        email=email_clean,
        otp=otp_code,
        expires_at=expires_at,
        verified=False
    )
    db.add(otp_record)
    db.commit()

    # Send OTP
    send_otp_email(
        email_clean,
        payload.full_name,
        otp_code,
        badge_upper,
        payload.station or "N/A",
        payload.rank or "N/A",
        payload.state or "N/A",
        payload.district or "N/A"
    )

    return {"status": "success", "message": "OTP Sent Successfully"}


@router.post("/login", response_model=Token)
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    badge_upper = payload.badge_number.strip().upper()
    officer = db.query(Officer).filter(Officer.badge_number == badge_upper).first()
    if not officer or not verify_password(payload.password, officer.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid badge number or password")

    if not officer.is_verified:
        # Generate dynamic verification code
        otp_code = f"{random.randint(100000, 999999)}"
        expires_at = datetime.now(timezone.utc) + timedelta(minutes=10)
        
        otp_record = OTPRecord(
            email=officer.email,
            otp=otp_code,
            expires_at=expires_at,
            verified=False
        )
        db.add(otp_record)
        db.commit()
        
        send_otp_email(
            officer.email,
            officer.full_name,
            otp_code,
            officer.badge_number,
            officer.station or "N/A",
            officer.rank or "N/A",
            officer.state or "N/A",
            officer.district or "N/A"
        )
        
        return Token(
            access_token=None,
            status="otp_required",
            message="OTP verification required. Check your registered email.",
            badge_number=officer.badge_number,
            email=officer.email
        )

    token = create_access_token({"sub": officer.badge_number, "role": officer.role})
    return Token(access_token=token, status="success")


class OTPVerifyRequest(BaseModel):
    email: str
    otp: str
    badge_number: str
    full_name: str
    password: str
    station: Optional[str] = None
    rank: Optional[str] = None
    state: Optional[str] = None
    district: Optional[str] = None


@router.post("/verify-otp")
def verify_otp(payload: OTPVerifyRequest, db: Session = Depends(get_db)):
    email_clean = payload.email.strip()
    badge_upper = payload.badge_number.strip().upper()
    
    print(f"DEBUG: verify_otp inputs: email={payload.email!r}, badge={payload.badge_number!r}, otp={payload.otp!r}")
    
    # Resolve email from database if not provided/empty but badge number is present
    if not email_clean and badge_upper:
        officer = db.query(Officer).filter(Officer.badge_number == badge_upper).first()
        print(f"DEBUG: resolved officer lookup: {officer}")
        if officer and officer.email:
            email_clean = officer.email.strip()
            print(f"DEBUG: resolved email_clean from officer: {email_clean!r}")
            
    # 1. Verify OTP record
    from sqlalchemy import func
    print(f"DEBUG: querying OTPRecord with email_clean={email_clean!r}")
    otp_record = db.query(OTPRecord).filter(
        func.lower(OTPRecord.email) == func.lower(email_clean),
        OTPRecord.verified == False
    ).order_by(OTPRecord.created_at.desc()).first()

    print(f"DEBUG: found otp_record: {otp_record}")
    if otp_record:
        print(f"DEBUG: otp_record otp={otp_record.otp!r}, payload otp={payload.otp!r}")

    if not otp_record or otp_record.otp.strip() != payload.otp.strip():
        raise HTTPException(status_code=400, detail="Invalid OTP code")

    # Safe comparison to prevent naive vs aware comparison issues
    now = datetime.now(timezone.utc)
    expires_at = otp_record.expires_at
    if expires_at.tzinfo is None:
        now = now.replace(tzinfo=None)

    if now > expires_at:
        raise HTTPException(status_code=400, detail="OTP code has expired")

    # 2. Check if user already exists in DB
    existing = db.query(Officer).filter(
        (Officer.badge_number == badge_upper) | (Officer.email == email_clean)
    ).first()
    
    if existing:
        if existing.is_verified:
            raise HTTPException(status_code=400, detail="Badge number or email already registered")
        else:
            # Unverified account exists. Let's update details and activate it.
            existing.full_name = payload.full_name
            existing.hashed_password = hash_password(payload.password)
            existing.station = payload.station
            existing.rank = payload.rank
            existing.state = payload.state
            existing.district = payload.district
            existing.is_verified = True
            officer = existing
    else:
        # 3. Save User in PostgreSQL
        officer = Officer(
            badge_number=badge_upper,
            full_name=payload.full_name,
            email=email_clean,
            hashed_password=hash_password(payload.password),
            role="officer",
            station=payload.station,
            rank=payload.rank,
            state=payload.state,
            district=payload.district,
            is_verified=True,
        )
        db.add(officer)

    # Mark OTP as verified
    otp_record.verified = True
    db.commit()
    
    # Send congratulations activation email
    date_of_joining = officer.created_at.strftime("%d %b %Y") if officer.created_at else None
    send_activation_email(
        to_email=email_clean,
        officer_name=officer.full_name,
        badge_id=officer.badge_number,
        rank=officer.rank or "N/A",
        station=officer.station or "N/A",
        role=officer.role,
        district=officer.district or "N/A",
        state=officer.state or "N/A",
        date_of_joining=date_of_joining,
        temporary_password=payload.password
    )
    
    return {"status": "success", "message": "Account Created Successfully"}


class ForgotPasswordRequest(BaseModel):
    email: str


@router.post("/forgot-password")
def forgot_password(payload: ForgotPasswordRequest, db: Session = Depends(get_db)):
    email_clean = payload.email.strip()
    officer = db.query(Officer).filter(Officer.email == email_clean).first()
    if not officer:
        raise HTTPException(status_code=404, detail="Email address not registered")

    # Generate OTP
    otp_code = f"{random.randint(100000, 999999)}"
    expires_at = datetime.now(timezone.utc) + timedelta(minutes=10)

    otp_record = OTPRecord(
        email=email_clean,
        otp=otp_code,
        expires_at=expires_at,
        verified=False
    )
    db.add(otp_record)
    db.commit()

    # Send Email
    send_otp_email(
        email_clean,
        officer.full_name,
        otp_code,
        officer.badge_number,
        officer.station or "N/A",
        officer.rank or "N/A",
        officer.state or "N/A",
        officer.district or "N/A"
    )

    return {"status": "success", "message": "OTP Sent Successfully"}


class ResetPasswordRequest(BaseModel):
    email: str
    otp: str
    new_password: str


@router.post("/reset-password")
def reset_password(payload: ResetPasswordRequest, db: Session = Depends(get_db)):
    email_clean = payload.email.strip()
    
    # Verify OTP
    otp_record = db.query(OTPRecord).filter(
        OTPRecord.email == email_clean,
        OTPRecord.verified == False
    ).order_by(OTPRecord.created_at.desc()).first()

    if not otp_record or otp_record.otp.strip() != payload.otp.strip():
        raise HTTPException(status_code=400, detail="Invalid OTP code")

    if datetime.now(timezone.utc) > otp_record.expires_at:
        raise HTTPException(status_code=400, detail="OTP code has expired")

    officer = db.query(Officer).filter(Officer.email == email_clean).first()
    if not officer:
        raise HTTPException(status_code=404, detail="Officer account not found")

    # Mark OTP verified
    otp_record.verified = True
    
    # Update Password
    officer.hashed_password = hash_password(payload.new_password)
    db.commit()

    return {"status": "success", "message": "Password Updated Successfully"}



@router.get("/me", response_model=OfficerOut)
def get_me(officer: Officer = Depends(require_role("officer", "station_head", "admin"))):
    return officer


@router.get("/officers", response_model=list[OfficerOut])
def get_officers(
    db: Session = Depends(get_db),
    _admin: Officer = Depends(require_role("admin")),
):
    """Allows administrators to view all registered officers."""
    return db.query(Officer).order_by(Officer.full_name.asc()).all()


@router.delete("/officers/{officer_id}")
def delete_officer(
    officer_id: int,
    db: Session = Depends(get_db),
    admin: Officer = Depends(require_role("admin")),
):
    """Allows administrators to delete an officer account."""
    if officer_id == admin.id:
        raise HTTPException(status_code=400, detail="An administrator cannot delete their own account.")

    officer = db.query(Officer).filter(Officer.id == officer_id).first()
    if not officer:
        raise HTTPException(status_code=404, detail="Officer not found")

    db.delete(officer)
    db.commit()
    return {"status": "ok", "message": f"Deleted officer {officer.full_name} (Badge: {officer.badge_number})"}

