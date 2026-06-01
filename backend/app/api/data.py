from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.models.database import get_db
from app.models.models import OutbreakRecord
from typing import List, Optional

router = APIRouter()

@router.get("/outbreaks")
def get_outbreaks(
    disease: Optional[str] = None,
    region: Optional[str] = None,
    limit: int = Query(default=100, le=1000),
    offset: int = Query(default=0, ge=0),
    db: Session = Depends(get_db)
):
    query = db.query(OutbreakRecord)
    if disease:
        query = query.filter(OutbreakRecord.disease == disease)
    if region:
        query = query.filter(OutbreakRecord.region == region)
    total = query.count()
    records = query.offset(offset).limit(limit).all()
    return {"total": total, "offset": offset, "limit": limit, "records": records}

@router.get("/diseases")
def get_diseases(db: Session = Depends(get_db)):
    diseases = db.query(OutbreakRecord.disease).distinct().all()
    return [d[0] for d in diseases]

@router.get("/regions")
def get_regions(db: Session = Depends(get_db)):
    regions = db.query(OutbreakRecord.region).distinct().all()
    return [r[0] for r in regions]
