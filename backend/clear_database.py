import os
import sys
import shutil
from pathlib import Path
from sqlalchemy import text, inspect

# Add parent directory to path so we can import from app
sys.path.append(str(Path(__file__).resolve().parent))

from app.core.database import SessionLocal, Base, engine
from app.models.user import Officer
from app.core.security import hash_password

def clear_db():
    print("Database connection URL:", engine.url)
    
    # 1. Drop all tables
    inspector = inspect(engine)
    try:
        table_names = inspector.get_table_names()
    except Exception as e:
        print(f"Error inspecting database: {e}")
        table_names = []
    
    print(f"Found existing tables to drop: {table_names}")
    
    # Drop all using SQLAlchemy metadata first
    print("Dropping tables via SQLAlchemy metadata...")
    try:
        Base.metadata.drop_all(bind=engine)
    except Exception as e:
        print(f"Base.metadata.drop_all failed: {e}")
    
    # Drop any leftover tables (e.g. raw_ tables or other dependencies) using CASCADE
    with engine.begin() as conn:
        if "postgresql" in str(engine.url):
            for table in table_names:
                try:
                    conn.execute(text(f'DROP TABLE IF EXISTS "{table}" CASCADE'))
                    print(f"Dropped table: {table} (CASCADE)")
                except Exception as e:
                    print(f"Could not drop table {table}: {e}")
        else:
            for table in table_names:
                try:
                    conn.execute(text(f'DROP TABLE IF EXISTS "{table}"'))
                    print(f"Dropped table: {table}")
                except Exception as e:
                    print(f"Could not drop table {table}: {e}")

    # 2. Recreate empty tables
    print("Recreating empty tables...")
    Base.metadata.create_all(bind=engine)
    
    # 3. Create default admin account so they can log back in
    db = SessionLocal()
    badge_number = "ADMIN001"
    full_name = "System Admin"
    password = "admin"
    
    try:
        existing = db.query(Officer).filter(Officer.badge_number == badge_number).first()
        if existing:
            print("Admin account already exists.")
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
            print(f"Default admin account recreated: {badge_number} / {password}")
    except Exception as e:
        print(f"Error recreating admin account: {e}")
        db.rollback()
    finally:
        db.close()

    # 4. Clear Chroma DB vector index
    chroma_dir = Path("chroma_store")
    if chroma_dir.exists() and chroma_dir.is_dir():
        print("Clearing ChromaDB vector store directory...")
        for item in chroma_dir.iterdir():
            try:
                if item.is_dir():
                    shutil.rmtree(item)
                else:
                    item.unlink()
                print(f"Deleted vector file: {item.name}")
            except Exception as e:
                print(f"Could not delete {item}: {e}")
        print("ChromaDB vector store cleared.")
    else:
        print("No ChromaDB directory found to clear.")

    print("\nDatabase cleared successfully!")

if __name__ == "__main__":
    clear_db()
