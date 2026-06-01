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
        self.extra_regressors = ["rainfall", "humidity"]

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
        
        # Merge with weather data for regressors
        from services.weather_service import WeatherService
        WEATHER_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data", "processed", "weather_data.csv")
        if not os.path.exists(WEATHER_PATH):
            WeatherService().build_weather_dataset()
            
        weather_df = pd.read_csv(WEATHER_PATH)
        weather_df = weather_df[weather_df["city"] == region].copy()
        weather_df["date"] = pd.to_datetime(weather_df["date"])
        
        # Resample to weekly
        weather_weekly = weather_df.set_index("date").resample("W-FRI").mean().reset_index()
        weather_weekly.rename(columns={"date": "ds"}, inplace=True)
        
        # Merge
        prophet_df = pd.merge(prophet_df, weather_weekly[["ds", "rainfall", "humidity"]], on="ds", how="left")
        
        # Fill missing values with means if any
        prophet_df["rainfall"] = prophet_df["rainfall"].fillna(prophet_df["rainfall"].mean())
        prophet_df["humidity"] = prophet_df["humidity"].fillna(prophet_df["humidity"].mean())
        
        # Handle case if mean is NaN (e.g. no weather data at all)
        prophet_df["rainfall"] = prophet_df["rainfall"].fillna(0)
        prophet_df["humidity"] = prophet_df["humidity"].fillna(50)
        
        return prophet_df

    def add_regressor(self, column: str):
        """Add additional regressors."""
        if column not in self.extra_regressors:
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
        
        # Add regressors to future dataframe
        for col in self.extra_regressors:
            future[col] = df[col].values
            
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
        
        # We need future regressor values for predictions. We will use the most recent historical means
        # corresponding to the same time of year, or simply the last available values.
        df = self._load_dataframe(self.disease, self.region)
        
        for col in self.extra_regressors:
            # Reconstruct historical values for future dataframe
            hist_vals = df[col].values
            # For future periods, naive approach: use historical average of that week of year
            df['week'] = df['ds'].dt.isocalendar().week
            weekly_avg = df.groupby('week')[col].mean().to_dict()
            
            future['week'] = future['ds'].dt.isocalendar().week
            future[col] = future['week'].map(weekly_avg)
            
            # If any week is missing, use global mean
            future[col] = future[col].fillna(df[col].mean())
            future.drop(columns=['week'], inplace=True)

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
