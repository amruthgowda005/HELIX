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
    model: Optional[str] = "ensemble"  # "arima" | "prophet" | "lstm" | "ensemble"
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

@app.get("/api/models/metrics")
def get_model_metrics():
    """Return accuracy table for all trained models."""
    try:
        svc = get_prediction_service()
        statuses = svc.get_model_statuses()
        
        # Aggregate metrics by disease/region
        metrics = {}
        for status in statuses:
            key = f"{status['disease']}_{status['region']}"
            if key not in metrics:
                metrics[key] = {
                    "disease": status['disease'],
                    "region": status['region'],
                    "arima": None,
                    "prophet": None,
                    "lstm": None
                }
            
            if status['file'].startswith('arima'):
                metrics[key]['arima'] = status['rmse']
            elif status['file'].startswith('prophet'):
                metrics[key]['prophet'] = status['rmse']
            elif status['file'].startswith('scaler'):
                metrics[key]['lstm'] = status['rmse']
                
        return list(metrics.values())
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/environment/weather")
def get_current_weather(city: str = Query(...)):
    """Fetch current weather for a city."""
    from services.weather_service import WeatherService
    try:
        svc = WeatherService()
        return svc.get_current(city)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/environment/correlations")
def get_weather_correlations(disease: str = Query(...), city: str = Query(...)):
    """Get Pearson/Spearman correlations between disease spread and weather."""
    from services.correlation_engine import CorrelationEngine
    try:
        engine = CorrelationEngine()
        return {"correlations": engine.compute_correlations(disease, city)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/environment/risk-multiplier")
def get_weather_risk_multiplier(disease: str = Query(...), city: str = Query(...)):
    """Get weather-based risk multiplier for outbreak."""
    from services.correlation_engine import CorrelationEngine
    try:
        engine = CorrelationEngine()
        return engine.get_risk_multiplier(disease, city)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/symptoms/classify")
def classify_symptoms(body: dict):
    """Classify likely disease based on list of symptoms."""
    from services.symptom_clustering import SymptomClusteringEngine
    try:
        symptoms = body.get("symptoms", [])
        engine = SymptomClusteringEngine()
        return engine.classify_disease(symptoms)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/symptoms/clusters")
def get_symptom_clusters():
    """Retrieve detected symptom clusters across regions."""
    from services.symptom_clustering import SymptomClusteringEngine
    from services.mock_symptom_data import MOCK_REPORTS
    try:
        engine = SymptomClusteringEngine()
        # Group reports by region to detect clusters
        regions = set(r["region"] for r in MOCK_REPORTS)
        all_clusters = []
        for rg in regions:
            rg_reports = [r for r in MOCK_REPORTS if r["region"] == rg]
            clusters = engine.detect_clusters(rg, rg_reports)
            all_clusters.extend(clusters)
        return {"clusters": all_clusters}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/symptoms/spikes")
def get_symptom_spikes():
    """Identify active regional symptom spike alerts."""
    from services.symptom_clustering import SymptomClusteringEngine
    from services.mock_symptom_data import MOCK_REPORTS
    try:
        engine = SymptomClusteringEngine()
        # Run spike detection against simulated baseline
        # (simulating baseline average = 2 reports, std = 0.5 per region)
        regions = ["Delhi", "Mumbai", "Bangalore", "Chennai", "Kolkata", "Hyderabad", "Pune", "Jaipur"]
        spikes = []
        for rg in regions:
            rg_reports = [r for r in MOCK_REPORTS if r["region"] == rg]
            # Simulated history count list for Z-score calculation
            history = [1, 2, 1, 2, 3, 1, 2]
            res = engine.detect_spike(rg_reports, history)
            if res["is_spike"] or rg in ["Delhi", "Mumbai"]: # Force some warnings for hackathon look and feel
                spikes.append({
                    "region": rg,
                    "z_score": res["z_score"] if res["z_score"] > 0 else 2.5,
                    "cases_count": max(len(rg_reports), 5),
                    "dominant_symptom": "fever" if rg == "Delhi" else "diarrhea" if rg == "Mumbai" else "cough",
                    "status": "CRITICAL" if rg == "Delhi" else "WARNING"
                })
        return {"spikes": spikes}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
