import os
import sys
from pathlib import Path
from datetime import datetime

# Add parent directory to path so we can import from app
sys.path.append(str(Path(__file__).resolve().parent))

from app.core.database import SessionLocal, Base, engine
from app.models.user import Officer
from app.models.case import Case
from app.models.missing_person import MissingPerson
from app.core.security import hash_password
from app.services.search_service import index_case
from sqlalchemy import text

# Ensure all tables are created
Base.metadata.create_all(bind=engine)

# Dynamic migration check to add 'rank' column if it's missing in an existing database
from sqlalchemy import text
try:
    with engine.begin() as conn:
        conn.execute(text('SELECT "rank" FROM officers LIMIT 1'))
except Exception:
    try:
        with engine.begin() as conn:
            conn.execute(text('ALTER TABLE officers ADD COLUMN "rank" VARCHAR(50)'))
        print("Successfully added 'rank' column to 'officers' table via migration in seed_db.")
    except Exception as e:
        print(f"Notice: Dynamic column creation skipped or failed: {e}")

# Dynamic migration check to add 'assigned_officer_id' column to raw_complaints
try:
    with engine.begin() as conn:
        conn.execute(text('SELECT assigned_officer_id FROM raw_complaints LIMIT 1'))
except Exception:
    try:
        with engine.begin() as conn:
            conn.execute(text('ALTER TABLE raw_complaints ADD COLUMN assigned_officer_id INTEGER'))
        print("Successfully added 'assigned_officer_id' column to 'raw_complaints' table via migration in seed_db.")
    except Exception as e:
        print(f"Notice: Dynamic complaint column creation skipped: {e}")


def parse_date(date_str):
    if not date_str:
        return None
    for fmt in ("%Y-%m-%d", "%Y-%m-%d %H:%M:%S", "%d-%m-%Y"):
        try:
            return datetime.strptime(date_str.strip(), fmt)
        except ValueError:
            continue
    return None


def seed_database():
    db = SessionLocal()
    print("Database seeding started...")

    # 1. Seed Officers
    print("\nSeeding Officers...")
    try:
        raw_users = db.execute(text("SELECT name, badge_id, email, role, police_station FROM raw_users")).all()
        for u in raw_users:
            badge = u.badge_id.strip()
            existing = db.query(Officer).filter(Officer.badge_number == badge).first()
            if not existing:
                # Map roles correctly to lowercase
                role_mapped = u.role.lower().strip()
                if "admin" in role_mapped:
                    role_mapped = "admin"
                elif "head" in role_mapped or "station" in role_mapped:
                    role_mapped = "station_head"
                else:
                    role_mapped = "officer"

                # Map rank dynamically based on role
                rank_mapped = "Constable"
                if role_mapped == "admin":
                    rank_mapped = "DGP"
                elif role_mapped == "station_head":
                    rank_mapped = "CI"
                else:
                    rank_mapped = "SI" if (len(badge) > 0 and ord(badge[-1]) % 2 == 0) else "Constable"

                officer = Officer(
                    badge_number=badge,
                    full_name=u.name,
                    email=u.email,
                    hashed_password=hash_password("password123"),
                    role=role_mapped,
                    station=u.police_station,
                    rank=rank_mapped,
                )
                db.add(officer)
        db.commit()
        print(f"Officers table seeded successfully. Current count: {db.query(Officer).count()}")
    except Exception as e:
        print(f"Error seeding officers: {e}")
        db.rollback()

    # 2. Seed Cases & index in ChromaDB
    print("\nSeeding Cases & Indexing in ChromaDB...")
    try:
        # Join raw_fir_records and raw_complaints to construct detailed Case records
        query = text("""
            SELECT f.fir_id, f.crime_type, f.status, f.victim_name, f.incident_date, f.location, c.complaint, f.ipc_bns_section
            FROM raw_fir_records f
            LEFT JOIN raw_complaints c ON f.complaint_id = c.complaint_id
            LIMIT 100
        """)
        raw_cases = db.execute(query).all()

        for c in raw_cases:
            fir_num = c.fir_id.strip()
            existing = db.query(Case).filter(Case.fir_number == fir_num).first()
            if not existing:
                inc_date = parse_date(c.incident_date)
                desc = c.complaint if c.complaint else f"Incident involving {c.crime_type} at {c.location}. Applicable sections: {c.ipc_bns_section}"

                # map status
                status_mapped = c.status.lower().strip()
                if status_mapped not in ["new", "investigating", "chargesheet", "closed"]:
                    status_mapped = "new"

                new_case = Case(
                    fir_number=fir_num,
                    crime_type=c.crime_type,
                    status=status_mapped,
                    complainant_name=c.victim_name,
                    location=c.location,
                    incident_date=inc_date,
                    description=desc,
                )
                db.add(new_case)
                db.flush()  # to populate id

                # Index in ChromaDB
                index_case(
                    new_case.id,
                    desc,
                    metadata={
                        "crime_type": new_case.crime_type or "",
                        "location": new_case.location or "",
                        "vehicle_involved": "",
                        "status": new_case.status,
                    },
                )
        db.commit()
        print(f"Cases seeded & indexed in ChromaDB. Current count: {db.query(Case).count()}")
    except Exception as e:
        print(f"Error seeding cases: {e}")
        db.rollback()

    # 3. Seed Missing Persons
    print("\nSeeding Missing Persons...")
    try:
        # Check if missing_persons table is already seeded
        if db.query(MissingPerson).count() == 0:
            raw_missing = db.execute(text("""
                SELECT missing_id, name, age, gender, last_seen, district, missing_date, status 
                FROM raw_missing_persons
            """)).all()

            for mp in raw_missing:
                m_date = parse_date(mp.missing_date)
                # Generate a mock photo URL using UI avatars or local placeholders
                mock_photo = f"https://ui-avatars.com/api/?name={mp.name.replace(' ', '+')}&background=1B2536&color=E8A33D"
                new_person = MissingPerson(
                    missing_id=mp.missing_id,
                    name=mp.name,
                    age=int(mp.age),
                    gender=mp.gender,
                    photo_url=mock_photo,
                    last_seen=mp.last_seen,
                    location=mp.district,
                    missing_date=m_date,
                    status=mp.status,
                )
                db.add(new_person)
            db.commit()
            print(f"Missing Persons seeded successfully. Current count: {db.query(MissingPerson).count()}")
        else:
            print("Missing Persons table already has data. Skipping.")
    except Exception as e:
        print(f"Error seeding missing persons: {e}")
        db.rollback()

    db.close()
    print("\nDatabase seeding completed successfully!")


if __name__ == "__main__":
    seed_database()
