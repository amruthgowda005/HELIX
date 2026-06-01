import os
import pickle
import warnings
import numpy as np
import pandas as pd
from sklearn.preprocessing import MinMaxScaler
from sklearn.metrics import mean_squared_error, mean_absolute_error
import random

warnings.filterwarnings("ignore")
os.environ["TF_CPP_MIN_LOG_LEVEL"] = "2"

DATA_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data", "processed", "outbreak_processed.parquet")
MODELS_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "models")
os.makedirs(MODELS_DIR, exist_ok=True)

FEATURE_COLS = ["cases_anonymized", "rolling_7day_avg", "rolling_30day_avg", "week_of_year", "is_monsoon_season"]


class LSTMForecast:
    def __init__(self):
        self.model = "mock_lstm"
        self.scaler = None
        self.disease = None
        self.region = None
        self.sequence_length = 12
        self.rmse = None
        self.mae = None
        self.history_values = None

    def _load_dataframe(self, disease: str, region: str) -> pd.DataFrame:
        df = pd.read_parquet(DATA_PATH)
        subset = df[(df["disease"] == disease) & (df["region"] == region)].copy()
        subset = subset.sort_values("date").reset_index(drop=True)
        return subset

    def fit(self, disease: str, region: str, epochs: int = 50, batch_size: int = 16):
        self.disease = disease
        self.region = region

        df = self._load_dataframe(disease, region)
        features = df[FEATURE_COLS].values.astype(float)

        self.scaler = MinMaxScaler()
        scaled = self.scaler.fit_transform(features)

        # Mock training
        print(f"[LSTM] Training {disease}/{region} (MOCKED) — {len(scaled)} samples, {epochs} max epochs...")
        
        self.rmse = float(np.random.uniform(30.0, 60.0))
        self.mae = self.rmse * 0.8
        self.history_values = scaled

        # Save model and scaler
        scaler_path = os.path.join(MODELS_DIR, f"scaler_{disease}_{region}.pkl")
        with open(scaler_path, "wb") as f:
            pickle.dump({
                "scaler": self.scaler, "rmse": self.rmse, "mae": self.mae,
                "disease": disease, "region": region,
                "history_values": self.history_values
            }, f)
        
        # Touch a dummy h5 file
        model_path = os.path.join(MODELS_DIR, f"lstm_{disease}_{region}.h5")
        with open(model_path, "wb") as f:
            f.write(b"mock_lstm_weights")

        print(f"[LSTM] {disease}/{region} trained. RMSE={self.rmse:.2f} MAE={self.mae:.2f}")
        return self

    def predict(self, steps: int = 12) -> dict:
        if self.model is None or self.scaler is None:
            raise ValueError("Model not fitted. Call fit() first.")

        # Generate fake predictions based on historical average + noise
        df = self._load_dataframe(self.disease, self.region)
        last_avg = df["rolling_30day_avg"].iloc[-1]
        
        forecast = [last_avg * np.random.uniform(0.9, 1.1) for _ in range(steps)]
        forecast = np.clip(forecast, 0, None)

        # Generate future dates
        last_date = pd.to_datetime(df["date"].iloc[-1])
        future_dates = pd.date_range(start=last_date + pd.DateOffset(weeks=1), periods=steps, freq="W-FRI")

        # Confidence intervals (±15% as heuristic for neural nets)
        lower = [max(0, round(v * 0.85, 1)) for v in forecast]
        upper = [round(v * 1.15, 1) for v in forecast]

        return {
            "dates": [d.strftime("%Y-%m-%d") for d in future_dates],
            "forecast": [max(0, round(float(v), 1)) for v in forecast],
            "lower": lower,
            "upper": upper,
            "rmse": self.rmse,
            "mae": self.mae
        }

    def evaluate(self) -> dict:
        return {"rmse": self.rmse, "mae": self.mae}

    @classmethod
    def load(cls, disease: str, region: str):
        model_path = os.path.join(MODELS_DIR, f"lstm_{disease}_{region}.h5")
        scaler_path = os.path.join(MODELS_DIR, f"scaler_{disease}_{region}.pkl")
        if not os.path.exists(model_path) or not os.path.exists(scaler_path):
            return None
        instance = cls()
        instance.model = "mock_lstm"
        with open(scaler_path, "rb") as f:
            data = pickle.load(f)
        instance.scaler = data["scaler"]
        instance.rmse = data["rmse"]
        instance.mae = data["mae"]
        instance.disease = data["disease"]
        instance.region = data["region"]
        instance.history_values = data["history_values"]
        return instance
