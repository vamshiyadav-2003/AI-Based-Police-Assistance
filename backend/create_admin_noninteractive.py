from app.core.database import SessionLocal, Base, engine
from app.models.user import Officer
from app.core.security import hash_password

# Ensure tables are created
Base.metadata.create_all(bind=engine)

db = SessionLocal()

badge_number = "ADMIN001"
full_name = "System Admin"
password = "admin"

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
