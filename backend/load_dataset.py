"""
Loads the raw dataset (CSV / XLSX files in ../data) into your PostgreSQL
database so it's visible in pgAdmin 4.

This does NOT touch the app's own tables (officers, cases, case_updates,
chat_messages) - it creates separate tables (one per file) so you can browse
the raw dataset in pgAdmin, or use it later to seed the real app tables.

Usage:
    cd backend
    # make sure .env has DATABASE_URL pointing at your Postgres instance
    pip install pandas openpyxl sqlalchemy psycopg2-binary python-dotenv
    python load_dataset.py

After it runs:
    1. Open pgAdmin 4
    2. Connect to the same server/database as in your DATABASE_URL
    3. Refresh "Schemas > public > Tables" - you'll see one table per file,
       prefixed with "raw_" (e.g. raw_fir_records, raw_complaints, ...)
"""

import os
import sys
from pathlib import Path

import pandas as pd
from sqlalchemy import create_engine, text
from dotenv import load_dotenv

# --- Load DATABASE_URL from backend/.env -----------------------------------
BACKEND_DIR = Path(__file__).resolve().parent
load_dotenv(BACKEND_DIR / ".env")

DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    print("ERROR: DATABASE_URL not found.")
    print("  1. cd backend")
    print("  2. cp .env.example .env")
    print("  3. edit .env and set DATABASE_URL to your Postgres connection string")
    sys.exit(1)

DATA_DIR = BACKEND_DIR.parent / "data"

# --- Map each file to a clean table name ------------------------------------
FILES = {
    "fir_records.csv": "raw_fir_records",
    "case_assignments.csv": "raw_case_assignments",
    "complaints.csv": "raw_complaints",
    "crime_categories.csv": "raw_crime_categories",
    "criminal_records.csv": "raw_criminal_records",
    "dashboard_stats.csv": "raw_dashboard_stats",
    "evidence.csv": "raw_evidence",
    "missing_persons.csv": "raw_missing_persons",
    "police_stations.csv": "raw_police_stations",
    "reports.csv": "raw_reports",
    "vehicle_records.csv": "raw_vehicle_records",
    "chat_history.csv": "raw_chat_history",
    "users.xlsx": "raw_users",
}


def clean_columns(df: pd.DataFrame) -> pd.DataFrame:
    """Turn 'FIR ID', 'Complaint ID', 'Password (Hashed)' etc. into
    snake_case column names that are safe/comfortable in Postgres."""
    df.columns = (
        df.columns.str.strip()
        .str.lower()
        .str.replace(r"[^0-9a-zA-Z]+", "_", regex=True)
        .str.strip("_")
    )
    return df


def main():
    engine = create_engine(DATABASE_URL, pool_pre_ping=True)

    # sanity check connection early with a clear error message
    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
    except Exception as e:
        print("ERROR: could not connect to the database using DATABASE_URL.")
        print(f"  DATABASE_URL = {DATABASE_URL}")
        print(f"  {e}")
        sys.exit(1)

    print(f"Connected OK. Loading files from: {DATA_DIR}\n")

    for filename, table_name in FILES.items():
        path = DATA_DIR / filename
        
        # Support loading users.csv from root directory as fallback
        if filename == "users.xlsx" and not path.exists():
            root_users_csv = BACKEND_DIR.parent / "users.csv"
            if root_users_csv.exists():
                path = root_users_csv
                filename = "users.csv"

        if not path.exists():
            print(f"  [skip] {filename} not found")
            continue

        if filename.endswith(".xlsx"):
            df = pd.read_excel(path)
        else:
            df = pd.read_csv(path)

        df = clean_columns(df)

        df.to_sql(table_name, engine, if_exists="replace", index=False)
        print(f"  [ok]   {filename:<25} -> table '{table_name}' ({len(df)} rows)")

    print("\nDone. Open pgAdmin 4, refresh Schemas > public > Tables, "
          "and you should see the raw_* tables above.")


if __name__ == "__main__":
    main()
