from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
import httpx

router = APIRouter()
ML_SERVICE_URL = "http://localhost:8001"


class PredictRequest(BaseModel):
    disease: str
    region: str
    model: Optional[str] = "ensemble"
    steps: Optional[int] = 12


@router.post("/outbreak")
async def predict_outbreak(request: PredictRequest):
    """Proxy to ML service /api/predict/outbreak."""
    try:
        async with httpx.AsyncClient(timeout=120.0) as client:
            response = await client.post(
                f"{ML_SERVICE_URL}/api/predict/outbreak",
                json=request.model_dump()
            )
            response.raise_for_status()
            return response.json()
    except httpx.ConnectError:
        raise HTTPException(status_code=503, detail="ML service unavailable")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/risk-score")
async def get_risk_score(disease: str, region: str):
    """Proxy to ML service /api/predict/risk-score."""
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.get(
                f"{ML_SERVICE_URL}/api/predict/risk-score",
                params={"disease": disease, "region": region}
            )
            response.raise_for_status()
            return response.json()
    except httpx.ConnectError:
        raise HTTPException(status_code=503, detail="ML service unavailable")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/seasonal")
async def get_seasonal(disease: str):
    """Proxy to ML service /api/predict/seasonal."""
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.get(
                f"{ML_SERVICE_URL}/api/predict/seasonal",
                params={"disease": disease}
            )
            response.raise_for_status()
            return response.json()
    except httpx.ConnectError:
        raise HTTPException(status_code=503, detail="ML service unavailable")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/models/metrics")
async def get_model_metrics():
    """Proxy to ML service /api/models/metrics."""
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.get(
                f"{ML_SERVICE_URL}/api/models/metrics"
            )
            response.raise_for_status()
            return response.json()
    except httpx.ConnectError:
        raise HTTPException(status_code=503, detail="ML service unavailable")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
