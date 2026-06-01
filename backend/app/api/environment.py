import os
import httpx
from fastapi import APIRouter, HTTPException, Query

router = APIRouter()

ML_SERVICE_URL = os.environ.get("ML_SERVICE_URL", "http://localhost:8001")

@router.get("/weather")
async def get_weather(city: str = Query(...)):
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.get(
                f"{ML_SERVICE_URL}/api/environment/weather",
                params={"city": city}
            )
            response.raise_for_status()
            return response.json()
    except httpx.ConnectError:
        raise HTTPException(status_code=503, detail="ML service unavailable")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/correlations")
async def get_correlations(disease: str = Query(...), city: str = Query(...)):
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.get(
                f"{ML_SERVICE_URL}/api/environment/correlations",
                params={"disease": disease, "city": city}
            )
            response.raise_for_status()
            return response.json()
    except httpx.ConnectError:
        raise HTTPException(status_code=503, detail="ML service unavailable")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/risk-multiplier")
async def get_risk_multiplier(disease: str = Query(...), city: str = Query(...)):
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.get(
                f"{ML_SERVICE_URL}/api/environment/risk-multiplier",
                params={"disease": disease, "city": city}
            )
            response.raise_for_status()
            return response.json()
    except httpx.ConnectError:
        raise HTTPException(status_code=503, detail="ML service unavailable")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
