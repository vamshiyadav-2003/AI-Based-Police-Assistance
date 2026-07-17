"""
Run this ONCE to create your first admin account, since /auth/register
requires an existing admin to create new officers (chicken-and-egg problem).

Usage:
    cd backend
    python create_admin.py
"""
from app.core.database import SessionLocal, Base, engine
from app.models.user import Officer
from app.core.security import hash_password

Base.metadata.create_all(bind=engine)

db = SessionLocal()

badge_number = input("Admin badge number: ").strip()
full_name = input("Full name: ").strip()
password = input("Password: ").strip()

existing = db.query(Officer).filter(Officer.badge_number == badge_number).first()
if existing:
    print("An officer with this badge number already exists.")
else:
    admin = Officer(
        badge_number=badge_number,
        full_name=full_name,
        hashed_password=hash_password(password),
        role="admin",
        rank="DGP",
        is_verified=True,
    )
    db.add(admin)
    db.commit()
    print(f"Admin account created: {badge_number}")

db.close()
