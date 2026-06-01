import os
import pandas as pd
from sqlalchemy.orm import Session
from app.models.database import engine, Base, SessionLocal
from app.models.models import OutbreakRecord, AlertLog, NotificationLog, UserSymptomReport, EnvironmentalData  # noqa: F401 — ensure all tables are created

def init_db():
    print("Creating database tables...")
    Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()
    
    # Check if we already seeded data
    if db.query(OutbreakRecord).first():
        print("Database already seeded.")
        db.close()
        return

    parquet_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), "ml", "data", "processed", "outbreak_processed.parquet")
    
    if not os.path.exists(parquet_path):
        print(f"Processed data not found at {parquet_path}. Please run the ML pipeline first.")
        db.close()
        return
        
    print("Loading parquet data...")
    df = pd.read_parquet(parquet_path)
    
    print(f"Seeding {len(df)} records into SQLite...")
    records = []
    
    for _, row in df.iterrows():
        record = OutbreakRecord(
            date=row['date'].date(),
            region=row['region'],
            region_hash=row['region_hash'],
            disease=row['disease'],
            cases_anonymized=row['cases_anonymized'],
            deaths=row['deaths'],
            recovered=row['recovered'],
            population=row['population'],
            week_of_year=row['week_of_year'],
            month=row['month'],
            is_monsoon_season=row['is_monsoon_season'],
            rolling_7day_avg=row['rolling_7day_avg'] if pd.notna(row['rolling_7day_avg']) else 0.0,
            rolling_30day_avg=row['rolling_30day_avg'] if pd.notna(row['rolling_30day_avg']) else 0.0,
        )
        records.append(record)
        
        # Batch insert every 1000 records
        if len(records) >= 1000:
            db.bulk_save_objects(records)
            db.commit()
            records = []
            
    # Insert remaining
    if records:
        db.bulk_save_objects(records)
        db.commit()
        
    print("Database seeding complete!")
    db.close()

if __name__ == "__main__":
    init_db()
