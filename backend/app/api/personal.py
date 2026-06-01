import os
import httpx
from fastapi import APIRouter, HTTPException

router = APIRouter()

ML_SERVICE_URL = os.environ.get("ML_SERVICE_URL", "http://localhost:8001")

@router.post("/risk-assessment")
async def proxy_personal_risk_assessment(body: dict):
    """Proxy request to ML service for full personal risk assessment."""
    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            resp = await client.post(
                f"{ML_SERVICE_URL}/api/personal/risk-assessment",
                json=body
            )
            resp.raise_for_status()
            return resp.json()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/disease-risk")
async def proxy_personal_disease_risk(body: dict):
    """Proxy request to ML service for single condition risk assessment."""
    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            resp = await client.post(
                f"{ML_SERVICE_URL}/api/personal/disease-risk",
                json=body
            )
            resp.raise_for_status()
            return resp.json()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
