from fastapi import FastAPI, HTTPException, Query, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
import os
import sys

sys.path.insert(0, os.path.dirname(__file__))

app = FastAPI(title="Helix ML Service", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Lazy-loaded service singleton
_prediction_service = None

def get_prediction_service():
    global _prediction_service
    if _prediction_service is None:
        from services.prediction_service import PredictionService
        _prediction_service = PredictionService()
    return _prediction_service


class PredictRequest(BaseModel):
    disease: str
    region: str
    model: Optional[str] = "ensemble"  # "arima" | "prophet" | "ensemble"
    steps: Optional[int] = 12


@app.get("/health")
def health_check():
    return {"status": "ok", "service": "helix-ml"}


@app.post("/api/predict/outbreak")
def predict_outbreak(request: PredictRequest):
    """Run time-series forecast for a given disease/region."""
    try:
        svc = get_prediction_service()
        result = svc.run_single(
            disease=request.disease,
            region=request.region,
            model=request.model,
            steps=request.steps
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/predict/risk-score")
def get_risk_score(
    disease: str = Query(...),
    region: str = Query(...)
):
    """Return 0-100 risk score based on recent outbreak trajectory."""
    try:
        svc = get_prediction_service()
        return svc.get_risk_score(disease=disease, region=region)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/predict/seasonal")
def get_seasonal_trends(disease: str = Query(...)):
    """Return historical average seasonal pattern for a disease."""
    try:
        svc = get_prediction_service()
        return svc.get_seasonal_trends(disease=disease)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/models/status")
def get_model_statuses():
    """List all trained model artifacts and their performance metrics."""
    try:
        svc = get_prediction_service()
        return {"models": svc.get_model_statuses()}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
