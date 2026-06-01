import os
import pickle
import warnings
import numpy as np
import pandas as pd
from sklearn.metrics import mean_squared_error, mean_absolute_error

warnings.filterwarnings("ignore")

DATA_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data", "processed", "outbreak_processed.parquet")
MODELS_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "models")
os.makedirs(MODELS_DIR, exist_ok=True)


class ARIMAForecast:
    def __init__(self):
        self.model = None
        self.model_fit = None
        self.disease = None
        self.region = None
        self.history = None
        self.rmse = None
        self.mae = None

    def _load_series(self, disease: str, region: str) -> pd.Series:
        df = pd.read_parquet(DATA_PATH)
        subset = df[(df["disease"] == disease) & (df["region"] == region)].copy()
        subset = subset.sort_values("date")
        subset = subset.set_index("date")["cases_anonymized"].asfreq("W-FRI", method="ffill")
        return subset

    def fit(self, disease: str, region: str):
        self.disease = disease
        self.region = region
        series = self._load_series(disease, region)

        # Train/test split — last 20% for evaluation
        split = int(len(series) * 0.8)
        train, test = series[:split], series[split:]
        self.history = train

        try:
            import pmdarima as pm
            auto = pm.auto_arima(train, start_p=1, start_q=1, max_p=3, max_q=3,
                                 d=1, seasonal=False, stepwise=True,
                                 suppress_warnings=True, error_action="ignore", trace=False)
            order = auto.order
        except Exception:
            order = (2, 1, 2)

        from statsmodels.tsa.arima.model import ARIMA
        self.model = ARIMA(train, order=order)
        self.model_fit = self.model.fit()

        # Evaluate on test split
        preds = self.model_fit.forecast(steps=len(test))
        preds = np.clip(preds, 0, None)
        self.rmse = float(np.sqrt(mean_squared_error(test, preds)))
        self.mae = float(mean_absolute_error(test, preds))

        # Save artifact
        model_path = os.path.join(MODELS_DIR, f"arima_{disease}_{region}.pkl")
        with open(model_path, "wb") as f:
            pickle.dump({"model_fit": self.model_fit, "rmse": self.rmse, "mae": self.mae,
                         "disease": disease, "region": region}, f)

        print(f"[ARIMA] {disease}/{region} trained. RMSE={self.rmse:.2f} MAE={self.mae:.2f}")
        return self

    def predict(self, steps: int = 12) -> dict:
        if self.model_fit is None:
            raise ValueError("Model not fitted. Call fit() first.")
        forecast = self.model_fit.forecast(steps=steps)
        conf_int = self.model_fit.get_forecast(steps=steps).conf_int(alpha=0.2)
        last_date = self.history.index[-1]
        future_dates = pd.date_range(start=last_date + pd.DateOffset(weeks=1), periods=steps, freq="W-FRI")
        return {
            "dates": [d.strftime("%Y-%m-%d") for d in future_dates],
            "forecast": [max(0, round(v, 1)) for v in forecast.tolist()],
            "lower": [max(0, round(v, 1)) for v in conf_int.iloc[:, 0].tolist()],
            "upper": [max(0, round(v, 1)) for v in conf_int.iloc[:, 1].tolist()],
            "rmse": self.rmse,
            "mae": self.mae
        }

    def get_confidence_intervals(self) -> dict:
        return self.predict()

    def evaluate(self) -> dict:
        return {"rmse": self.rmse, "mae": self.mae}

    @classmethod
    def load(cls, disease: str, region: str):
        model_path = os.path.join(MODELS_DIR, f"arima_{disease}_{region}.pkl")
        if not os.path.exists(model_path):
            return None
        instance = cls()
        with open(model_path, "rb") as f:
            data = pickle.load(f)
        instance.model_fit = data["model_fit"]
        instance.rmse = data["rmse"]
        instance.mae = data["mae"]
        instance.disease = data["disease"]
        instance.region = data["region"]
        instance.history = instance._load_series(disease, region)[:int(len(instance._load_series(disease, region)) * 0.8)]
        return instance
