import os
import numpy as np
import pandas as pd
from typing import Optional

DATA_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data", "processed", "outbreak_processed.parquet")


class PredictionService:
    """Orchestrates ARIMA and Prophet models into an ensemble prediction service."""

    def _get_arima(self, disease: str, region: str):
        from .arima_model import ARIMAForecast
        model = ARIMAForecast.load(disease, region)
        if model is None:
            model = ARIMAForecast().fit(disease, region)
        return model

    def _get_prophet(self, disease: str, region: str):
        from .prophet_model import ProphetForecast
        model = ProphetForecast.load(disease, region)
        if model is None:
            model = ProphetForecast().fit(disease, region)
        return model

    def _get_lstm(self, disease: str, region: str):
        from .lstm_model import LSTMForecast
        model = LSTMForecast.load(disease, region)
        if model is None:
            model = LSTMForecast().fit(disease, region)
        return model

    def run_ensemble(self, disease: str, region: str, steps: int = 12) -> dict:
        """Run ARIMA + Prophet + LSTM and compute weighted average."""
        arima = self._get_arima(disease, region)
        prophet = self._get_prophet(disease, region)
        lstm = self._get_lstm(disease, region)

        arima_pred = arima.predict(steps=steps)
        prophet_pred = prophet.predict(periods=steps)
        lstm_pred = lstm.predict(steps=steps)

        # Align dates (use ARIMA dates as reference)
        dates = arima_pred["dates"]
        
        # Weights: ARIMA 30%, Prophet 30%, LSTM 40%
        w_arima, w_prophet, w_lstm = 0.3, 0.3, 0.4
        
        ensemble_forecast = [
            round((a * w_arima) + (p * w_prophet) + (l * w_lstm), 1)
            for a, p, l in zip(arima_pred["forecast"], prophet_pred["forecast"], lstm_pred["forecast"])
        ]
        ensemble_lower = [
            round((a * w_arima) + (p * w_prophet) + (l * w_lstm), 1)
            for a, p, l in zip(arima_pred["lower"], prophet_pred["lower"], lstm_pred["lower"])
        ]
        ensemble_upper = [
            round((a * w_arima) + (p * w_prophet) + (l * w_lstm), 1)
            for a, p, l in zip(arima_pred["upper"], prophet_pred["upper"], lstm_pred["upper"])
        ]
        
        # Weighted RMSE
        avg_rmse = round(
            (arima_pred.get("rmse", 0) * w_arima) + 
            (prophet_pred.get("rmse", 0) * w_prophet) + 
            (lstm_pred.get("rmse", 0) * w_lstm), 2
        )

        return {
            "model": "ensemble",
            "disease": disease,
            "region": region,
            "dates": dates,
            "forecast": ensemble_forecast,
            "lower": ensemble_lower,
            "upper": ensemble_upper,
            "rmse": avg_rmse,
            "arima_rmse": arima_pred.get("rmse"),
            "prophet_rmse": prophet_pred.get("rmse"),
            "lstm_rmse": lstm_pred.get("rmse")
        }

    def run_single(self, disease: str, region: str, model: str = "ensemble", steps: int = 12) -> dict:
        if model == "arima":
            arima = self._get_arima(disease, region)
            result = arima.predict(steps=steps)
            result["model"] = "arima"
            result["disease"] = disease
            result["region"] = region
            return result
        elif model == "prophet":
            prophet = self._get_prophet(disease, region)
            result = prophet.predict(periods=steps)
            result["model"] = "prophet"
            result["disease"] = disease
            result["region"] = region
            return result
        elif model == "lstm":
            lstm = self._get_lstm(disease, region)
            result = lstm.predict(steps=steps)
            result["model"] = "lstm"
            result["disease"] = disease
            result["region"] = region
            return result
        else:
            return self.run_ensemble(disease, region, steps)

    def get_seasonal_trends(self, disease: str) -> dict:
        """Return average case count per month across all regions (historical seasonality)."""
        df = pd.read_parquet(DATA_PATH)
        subset = df[df["disease"] == disease].copy()
        monthly = subset.groupby("month")["cases_anonymized"].mean().reset_index()
        return {
            "disease": disease,
            "months": monthly["month"].tolist(),
            "avg_cases": [round(v, 1) for v in monthly["cases_anonymized"].tolist()]
        }

    def get_risk_score(self, disease: str, region: str) -> dict:
        """
        0-100 risk score based on recent trend velocity:
        - Compare last 4 weeks average vs previous 4 weeks
        - Scale to 0-100
        """
        df = pd.read_parquet(DATA_PATH)
        subset = df[(df["disease"] == disease) & (df["region"] == region)].copy()
        subset = subset.sort_values("date")

        if len(subset) < 8:
            return {"disease": disease, "region": region, "risk_score": 50, "trend": "unknown"}

        recent = subset["cases_anonymized"].iloc[-4:].mean()
        previous = subset["cases_anonymized"].iloc[-8:-4].mean()

        if previous == 0:
            velocity = 0
        else:
            velocity = (recent - previous) / previous  # % change

        # Map velocity to 0-100 score
        # velocity of -1.0 (down 100%) = 0 risk, velocity of +1.0 (up 100%) = 100 risk
        score = int(np.clip((velocity + 1) * 50, 0, 100))

        if velocity > 0.2:
            trend = "rising"
        elif velocity < -0.2:
            trend = "falling"
        else:
            trend = "stable"

        return {
            "disease": disease,
            "region": region,
            "risk_score": score,
            "trend": trend,
            "recent_avg": round(recent, 1),
            "previous_avg": round(previous, 1),
            "velocity_pct": round(velocity * 100, 1)
        }

    def get_model_statuses(self) -> list:
        """List all trained model artifacts and their RMSE scores."""
        import pickle
        models_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), "models")
        statuses = []
        if not os.path.exists(models_dir):
            return statuses
        for fname in os.listdir(models_dir):
            if fname.endswith(".pkl"):
                fpath = os.path.join(models_dir, fname)
                try:
                    with open(fpath, "rb") as f:
                        data = pickle.load(f)
                    statuses.append({
                        "file": fname,
                        "disease": data.get("disease", "?"),
                        "region": data.get("region", "?"),
                        "rmse": data.get("rmse", None),
                        "mae": data.get("mae", None),
                    })
                except Exception:
                    pass
        return statuses
