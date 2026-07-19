import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.database import Base, engine
from app.routers import auth, cases, chat, fir, search, dashboard, complaints, criminal_records, missing_persons, vehicles, evidence, reports, admin

# Import models so SQLAlchemy knows about them before create_all runs
from app.models import *  # noqa: F403, F401


# Allow all origins in development — restrict in production via ALLOWED_ORIGINS env var
is_dev = not os.getenv("ALLOWED_ORIGINS")
allowed_origins = ["*"] if is_dev else []
env_origins = os.getenv("ALLOWED_ORIGINS")
if env_origins:
    if env_origins.strip() == "*":
        allowed_origins = ["*"]
    else:
        allowed_origins.extend([o.strip() for o in env_origins.split(",") if o.strip()])

app = FastAPI(title="AI Police Assistant API", version="1.0.0")

if "*" in allowed_origins:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=False,
        allow_methods=["*"],
        allow_headers=["*"],
    )
else:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=allowed_origins,
        allow_origin_regex=r"https://.*\.onrender\.com",
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )



@app.on_event("startup")
def on_startup():
    # Only CREATES tables that don't already exist in your database.
    # It will never touch or drop tables you already have.
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
            print("Successfully added 'rank' column to 'officers' table via migration.")
        except Exception as e:
            print(f"Notice: Dynamic column creation skipped or failed (might already exist or DB is initializing): {e}")

    # Dynamic migration check to add 'assigned_officer_id' column to raw_complaints
    try:
        with engine.begin() as conn:
            conn.execute(text('SELECT assigned_officer_id FROM raw_complaints LIMIT 1'))
    except Exception:
        try:
            with engine.begin() as conn:
                conn.execute(text('ALTER TABLE raw_complaints ADD COLUMN assigned_officer_id INTEGER'))
            print("Successfully added 'assigned_officer_id' column to 'raw_complaints' table via migration.")
        except Exception as e:
            print(f"Notice: Dynamic complaint column creation skipped: {e}")

    # Dynamic migration check to add 'otp_code', 'is_verified', 'state', and 'district' columns to officers
    try:
        with engine.begin() as conn:
            conn.execute(text('SELECT otp_code, is_verified, state, district FROM officers LIMIT 1'))
    except Exception:
        try:
            with engine.begin() as conn:
                try:
                    conn.execute(text('ALTER TABLE officers ADD COLUMN otp_code VARCHAR(10)'))
                except Exception:
                    pass
                try:
                    conn.execute(text('ALTER TABLE officers ADD COLUMN is_verified BOOLEAN DEFAULT FALSE'))
                except Exception:
                    pass
                try:
                    conn.execute(text('ALTER TABLE officers ADD COLUMN state VARCHAR(100)'))
                except Exception:
                    pass
                try:
                    conn.execute(text('ALTER TABLE officers ADD COLUMN district VARCHAR(100)'))
                except Exception:
                    pass
            print("Successfully verified and added missing columns ('otp_code', 'is_verified', 'state', 'district') to 'officers' table via migration.")
        except Exception as e:
            print(f"Notice: Dynamic columns creation skipped: {e}")

    # Dynamic migration check to verify 'otp_records' exists
    try:
        with engine.begin() as conn:
            conn.execute(text('SELECT id, email, otp, verified FROM otp_records LIMIT 1'))
    except Exception:
        try:
            with engine.begin() as conn:
                Base.metadata.create_all(bind=engine)
            print("Successfully verified/created 'otp_records' table on startup.")
        except Exception as e:
            print(f"Notice: 'otp_records' check or creation failed: {e}")


app.include_router(auth.router)
app.include_router(cases.router)
app.include_router(chat.router)
app.include_router(fir.router)
app.include_router(search.router)
app.include_router(dashboard.router)
app.include_router(complaints.router)
app.include_router(criminal_records.router)
app.include_router(missing_persons.router)
app.include_router(vehicles.router)
app.include_router(evidence.router)
app.include_router(reports.router)
app.include_router(admin.router)



@app.get("/")
def health_check():
    return {"status": "ok", "service": "AI Police Assistant API"}
