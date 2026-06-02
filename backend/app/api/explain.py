import os
import httpx
from fastapi import APIRouter, HTTPException

router = APIRouter()

ML_SERVICE_URL = os.environ.get("ML_SERVICE_URL", "http://localhost:8001")

@router.post("/outbreak")
async def explain_outbreak(body: dict):
    """Proxy request to ML service for outbreak prediction explanation."""
    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            resp = await client.post(
                f"{ML_SERVICE_URL}/api/explain/outbreak",
                json=body
            )
            resp.raise_for_status()
            return resp.json()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/personal-risk")
async def explain_personal_risk(body: dict):
    """Proxy request to ML service for personal risk explanation."""
    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            resp = await client.post(
                f"{ML_SERVICE_URL}/api/explain/personal-risk",
                json=body
            )
            resp.raise_for_status()
            return resp.json()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/alert")
async def explain_alert(body: dict):
    """Proxy request to ML service for alert explanation."""
    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            resp = await client.post(
                f"{ML_SERVICE_URL}/api/explain/alert",
                json=body
            )
            resp.raise_for_status()
            return resp.json()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
