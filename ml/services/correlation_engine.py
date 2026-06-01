import os
import pandas as pd
import numpy as np
from scipy.stats import pearsonr, spearmanr
from services.weather_service import WeatherService

DATA_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data", "processed", "outbreak_processed.parquet")
WEATHER_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data", "processed", "weather_data.csv")

class CorrelationEngine:
    def __init__(self):
        self.weather_svc = WeatherService()
        if not os.path.exists(WEATHER_PATH):
            self.weather_svc.build_weather_dataset()
            
    def compute_correlations(self, disease: str, region: str) -> list:
        """Compute Pearson/Spearman correlations with lags."""
        # Load outbreak data
        df = pd.read_parquet(DATA_PATH)
        outbreak_df = df[(df["disease"] == disease) & (df["region"] == region)].copy()
        if outbreak_df.empty:
            return []
            
        outbreak_df["date"] = pd.to_datetime(outbreak_df["date"])
        outbreak_df.set_index("date", inplace=True)
        
        # Load weather data
        weather_df = pd.read_csv(WEATHER_PATH)
        weather_df = weather_df[weather_df["city"] == region].copy()
        if weather_df.empty:
            return []
            
        weather_df["date"] = pd.to_datetime(weather_df["date"])
        
        # Resample weather to weekly to match outbreak data
        weather_weekly = weather_df.set_index("date")[["temp", "humidity", "rainfall", "aqi"]].resample("W-FRI").mean()
        
        # Merge
        merged = outbreak_df.join(weather_weekly, how="inner")
        
        if len(merged) < 10:
            return []

        correlations = []
        weather_vars = ["temp", "humidity", "rainfall", "aqi"]
        
        for var in weather_vars:
            for lag in [0, 1, 2, 3, 4]:
                # Shift weather var forward by 'lag' weeks
                lagged_var = merged[var].shift(lag)
                valid_idx = lagged_var.notna() & merged["cases_anonymized"].notna()
                
                if sum(valid_idx) > 10:
                    x = lagged_var[valid_idx]
                    y = merged["cases_anonymized"][valid_idx]
                    
                    pearson, p_p = pearsonr(x, y)
                    spearman, p_s = spearmanr(x, y)
                    
                    correlations.append({
                        "variable": var,
                        "lag_weeks": lag,
                        "pearson": round(pearson, 3) if not np.isnan(pearson) else 0,
                        "spearman": round(spearman, 3) if not np.isnan(spearman) else 0,
                        "p_value": round(p_p, 4) if not np.isnan(p_p) else 1
                    })
                    
        # Sort by absolute pearson
        correlations.sort(key=lambda x: abs(x["pearson"]), reverse=True)
        return correlations

    def get_risk_multiplier(self, disease: str, city: str) -> dict:
        """Calculate a risk multiplier based on current weather conditions."""
        weather = self.weather_svc.get_current(city)
        multiplier = 1.0
        factors = []
        
        temp = weather["temp"]
        humidity = weather["humidity"]
        rainfall = weather["rainfall"]
        aqi = weather["aqi"]
        
        if disease == "Dengue":
            # High correlation with rainfall and humidity
            if rainfall > 10:
                multiplier *= 1.3
                factors.append("High rainfall increases mosquito breeding")
            if humidity > 70:
                multiplier *= 1.2
                factors.append("High humidity favors vector survival")
        
        elif disease == "Malaria":
            # Temp 20-30C and rainfall
            if 20 <= temp <= 30:
                multiplier *= 1.2
                factors.append("Optimal temperature for transmission")
            if rainfall > 5:
                multiplier *= 1.15
                factors.append("Recent rainfall supports breeding")
                
        elif disease == "Cholera":
            # Rainfall drives contamination
            if rainfall > 20:
                multiplier *= 1.4
                factors.append("Heavy rainfall risk for water contamination")
                
        elif disease == "Influenza":
            # Low temp and low humidity
            if temp < 20:
                multiplier *= 1.25
                factors.append("Low temperature increases virus stability")
            if humidity < 50:
                multiplier *= 1.15
                factors.append("Low humidity promotes aerosol transmission")
        
        # AQI affects respiratory diseases generally
        if disease in ["Influenza", "COVID-19"]:
            if aqi > 200:
                multiplier *= 1.2
                factors.append("Poor air quality increases respiratory vulnerability")
                
        # Bound the multiplier
        multiplier = max(0.5, min(2.5, multiplier))
        
        return {
            "multiplier": round(multiplier, 2),
            "weather": weather,
            "risk_factors": factors
        }
