import os
import pickle
import warnings
import numpy as np
import pandas as pd
from sklearn.metrics import mean_squared_error

warnings.filterwarnings("ignore")

DATA_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data", "processed", "outbreak_processed.parquet")
MODELS_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "models")
os.makedirs(MODELS_DIR, exist_ok=True)

# Indian public holidays (major ones) for seasonality
INDIAN_HOLIDAYS = pd.DataFrame({
    "holiday": "india_holiday",
    "ds": pd.to_datetime([
        "2023-01-26", "2023-08-15", "2023-10-02",
        "2024-01-26", "2024-08-15", "2024-10-02",
        "2025-01-26", "2025-08-15", "2025-10-02",
        "2026-01-26", "2026-08-15", "2026-10-02",
    ])
})


class ProphetForecast:
    def __init__(self):
        self.model = None
        self.disease = None
        self.region = None
        self.history_df = None
        self.rmse = None
        self.extra_regressors = []

    def _load_dataframe(self, disease: str, region: str) -> pd.DataFrame:
        df = pd.read_parquet(DATA_PATH)
        subset = df[(df["disease"] == disease) & (df["region"] == region)].copy()
        subset = subset.sort_values("date")
        # Prophet requires columns ds, y
        prophet_df = subset[["date", "cases_anonymized"]].rename(
            columns={"date": "ds", "cases_anonymized": "y"}
        )
        prophet_df["ds"] = pd.to_datetime(prophet_df["ds"])
        prophet_df["y"] = prophet_df["y"].clip(lower=0)
        return prophet_df

    def add_regressor(self, column: str):
        """Stub for Phase 5 — environmental variable integration (rainfall, AQI)."""
        self.extra_regressors.append(column)
        return self

    def fit(self, disease: str, region: str):
        from prophet import Prophet
        self.disease = disease
        self.region = region
        df = self._load_dataframe(disease, region)

        # Train/test split — last 20%
        split = int(len(df) * 0.8)
        train, test = df.iloc[:split], df.iloc[split:]
        self.history_df = train

        self.model = Prophet(
            holidays=INDIAN_HOLIDAYS,
            yearly_seasonality=True,
            weekly_seasonality=False,
            daily_seasonality=False,
            seasonality_mode="multiplicative",
            interval_width=0.80
        )

        # Add monsoon season as custom seasonality (June-Sept)
        self.model.add_seasonality(name="monsoon", period=365.25, fourier_order=5)

        for col in self.extra_regressors:
            self.model.add_regressor(col)

        self.model.fit(train)

        # Evaluate on test split
        future = self.model.make_future_dataframe(periods=len(test), freq="W")
        forecast = self.model.predict(future)
        test_preds = forecast.iloc[-len(test):]["yhat"].values
        test_preds = np.clip(test_preds, 0, None)
        self.rmse = float(np.sqrt(mean_squared_error(test["y"].values, test_preds)))

        # Save artifact
        model_path = os.path.join(MODELS_DIR, f"prophet_{disease}_{region}.pkl")
        with open(model_path, "wb") as f:
            pickle.dump({"model": self.model, "rmse": self.rmse,
                         "disease": disease, "region": region}, f)

        print(f"[Prophet] {disease}/{region} trained. RMSE={self.rmse:.2f}")
        return self

    def predict(self, periods: int = 12) -> dict:
        if self.model is None:
            raise ValueError("Model not fitted. Call fit() first.")
        future = self.model.make_future_dataframe(periods=periods, freq="W")
        forecast = self.model.predict(future)
        future_fc = forecast.tail(periods)
        return {
            "dates": future_fc["ds"].dt.strftime("%Y-%m-%d").tolist(),
            "forecast": [max(0, round(v, 1)) for v in future_fc["yhat"].tolist()],
            "lower": [max(0, round(v, 1)) for v in future_fc["yhat_lower"].tolist()],
            "upper": [max(0, round(v, 1)) for v in future_fc["yhat_upper"].tolist()],
            "rmse": self.rmse
        }

    def evaluate(self) -> dict:
        return {"rmse": self.rmse}

    @classmethod
    def load(cls, disease: str, region: str):
        model_path = os.path.join(MODELS_DIR, f"prophet_{disease}_{region}.pkl")
        if not os.path.exists(model_path):
            return None
        instance = cls()
        with open(model_path, "rb") as f:
            data = pickle.load(f)
        instance.model = data["model"]
        instance.rmse = data["rmse"]
        instance.disease = data["disease"]
        instance.region = data["region"]
        instance.history_df = instance._load_dataframe(disease, region)
        return instance
