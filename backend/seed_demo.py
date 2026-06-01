import os
import sys
import random
from datetime import datetime, timedelta
import hashlib

# Ensure we can import app modules from either backend/ or project root
sys.path.insert(0, os.path.dirname(__file__))

from app.models.database import SessionLocal, engine
from app.models.models import Base, UserSymptomReport, AlertLog, WearableReading

def seed_demo_data():
    print("Preparing Database Demo Seed...")
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    
    try:
        print("Seeding 3 active CRITICAL/HIGH alerts...")
        # Clear existing non-resolved alerts for clean demo
        db.query(AlertLog).filter(AlertLog.resolved == False).delete()
        
        alerts = [
            AlertLog(
                date=datetime.utcnow().date(),
                region="Delhi",
                disease="Dengue",
                severity="CRITICAL",
                message="Z-Score spike (3.4) detected. Heavy rainfall increases vector density.",
                resolved=False,
                created_at=datetime.utcnow() - timedelta(minutes=15)
            ),
            AlertLog(
                date=datetime.utcnow().date(),
                region="Mumbai",
                disease="Cholera",
                severity="HIGH",
                message="Case count surge in Colaba ward. Water quality degradation suspected.",
                resolved=False,
                created_at=datetime.utcnow() - timedelta(hours=2)
            ),
            AlertLog(
                date=datetime.utcnow().date(),
                region="Chennai",
                disease="Influenza",
                severity="HIGH",
                message="Sudden 45% increase in respiratory symptoms reported.",
                resolved=False,
                created_at=datetime.utcnow() - timedelta(hours=5)
            )
        ]
        db.bulk_save_objects(alerts)
        
        print("Seeding 200 symptom reports across regions...")
        regions = ["Delhi", "Mumbai", "Bangalore", "Chennai", "Kolkata", "Hyderabad", "Pune", "Jaipur"]
        symptoms_list = ["fever", "cough", "headache", "nausea", "fatigue", "joint pain", "diarrhea"]
        reports = []
        for _ in range(200):
            region = random.choice(regions)
            region_hash = hashlib.sha256(region.encode()).hexdigest()[:16]
            symps = random.sample(symptoms_list, k=random.randint(1, 3))
            reports.append(UserSymptomReport(
                date=(datetime.utcnow() - timedelta(days=random.randint(0, 3))).date(),
                region_hash=region_hash,
                symptoms=",".join(symps),
                risk_score=random.uniform(2.0, 8.5)
            ))
        db.bulk_save_objects(reports)
        
        print("Seeding Wearable readings for the last 24 hours...")
        db.query(WearableReading).filter(WearableReading.device_id == "sim_device_1").delete()
        readings = []
        now = datetime.utcnow()
        for i in range(144): # Every 10 mins for 24h
            ts = now - timedelta(minutes=(144-i)*10)
            readings.append(WearableReading(
                device_id="sim_device_1",
                heart_rate=random.randint(65, 85),
                spo2=random.randint(96, 100),
                steps=int(i * 50 + random.randint(0, 20)),
                sleep_hours=7.5,
                timestamp=ts
            ))
        db.bulk_save_objects(readings)
        
        db.commit()
        print("Demo Seed Complete! DB is locked and loaded.")
        
    except Exception as e:
        db.rollback()
        print(f"Failed to seed demo data: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    seed_demo_data()
