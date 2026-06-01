from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from app.models.database import get_db
from app.models.models import WearableReading

router = APIRouter()

@router.post("/ingest")
def ingest_wearable_data(body: dict, db: Session = Depends(get_db)):
    """Ingest simulated wearable device vitals."""
    try:
        ts = body.get("timestamp")
        timestamp = datetime.fromisoformat(ts) if ts else datetime.utcnow()
        
        reading = WearableReading(
            device_id=body.get("device_id", "sim_device_1"),
            heart_rate=body.get("heart_rate", 72),
            spo2=body.get("spo2", 98),
            steps=body.get("steps", 0),
            sleep_hours=body.get("sleep_hours", 0.0),
            timestamp=timestamp
        )
        db.add(reading)
        db.commit()
        db.refresh(reading)
        return {"status": "ok", "id": reading.id}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/latest")
def get_latest_reading(
    device_id: str = Query("sim_device_1"),
    db: Session = Depends(get_db)
):
    """Return most recent wearable reading for a device."""
    try:
        reading = db.query(WearableReading).filter(
            WearableReading.device_id == device_id
        ).order_by(WearableReading.timestamp.desc()).first()
        
        if not reading:
            # Fallback mock for demo if no data
            return {
                "heart_rate": 72,
                "spo2": 99,
                "steps": 4500,
                "sleep_hours": 7.2,
                "timestamp": datetime.utcnow().isoformat()
            }
            
        return {
            "heart_rate": reading.heart_rate,
            "spo2": reading.spo2,
            "steps": reading.steps,
            "sleep_hours": reading.sleep_hours,
            "timestamp": reading.timestamp.isoformat()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/trends")
def get_wearable_trends(
    device_id: str = Query("sim_device_1"),
    hours: int = Query(24),
    db: Session = Depends(get_db)
):
    """Return trend data for the past 24 hours."""
    try:
        cutoff = datetime.utcnow() - timedelta(hours=hours)
        readings = db.query(WearableReading).filter(
            WearableReading.device_id == device_id,
            WearableReading.timestamp >= cutoff
        ).order_by(WearableReading.timestamp.asc()).all()
        
        # Format for Recharts
        return {
            "trends": [
                {
                    "time": r.timestamp.strftime("%H:%M"),
                    "heart_rate": r.heart_rate,
                    "spo2": r.spo2
                } for r in readings
            ]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
