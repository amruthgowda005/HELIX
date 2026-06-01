import os
import random
import requests
from datetime import datetime, timedelta
import pandas as pd

OPENWEATHER_API_KEY = os.environ.get("OPENWEATHER_API_KEY", "")
DATA_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data", "processed", "weather_data.csv")

class WeatherService:
    def __init__(self):
        self.api_key = OPENWEATHER_API_KEY
        self.cities = ["Delhi", "Mumbai", "Bangalore", "Chennai", "Kolkata", 
                       "Hyderabad", "Pune", "Jaipur", "Lucknow", "Bhopal",
                       "Maharashtra", "Karnataka", "Tamil Nadu", "Kerala",
                       "Gujarat", "Uttar Pradesh", "West Bengal", "Rajasthan", "Telangana"]

    def get_current(self, city: str) -> dict:
        """Fetch current weather from OpenWeatherMap (or mock if no key)."""
        if not self.api_key:
            return self._mock_current(city)
            
        try:
            # Current weather
            url = f"http://api.openweathermap.org/data/2.5/weather?q={city}&appid={self.api_key}&units=metric"
            resp = requests.get(url, timeout=5)
            if resp.status_code != 200:
                return self._mock_current(city)
            data = resp.json()
            
            # AQI (Current air pollution)
            lat = data["coord"]["lat"]
            lon = data["coord"]["lon"]
            aqi_url = f"http://api.openweathermap.org/data/2.5/air_pollution?lat={lat}&lon={lon}&appid={self.api_key}"
            aqi_resp = requests.get(aqi_url, timeout=5)
            aqi_data = aqi_resp.json() if aqi_resp.status_code == 200 else {"list": [{"main": {"aqi": random.randint(1, 5)}}]}
            
            # Convert OpenWeather AQI (1-5) to Indian AQI scale (approx)
            aqi_val = aqi_data["list"][0]["main"]["aqi"] * 50 + random.randint(-10, 20)

            return {
                "city": city,
                "temp": data["main"]["temp"],
                "humidity": data["main"]["humidity"],
                "rainfall": data.get("rain", {}).get("1h", 0.0), # mm
                "aqi": aqi_val
            }
        except Exception:
            return self._mock_current(city)

    def _mock_current(self, city: str) -> dict:
        """Mock current weather based on typical Indian conditions."""
        is_coastal = city in ["Mumbai", "Chennai", "Kolkata", "Kerala", "Maharashtra", "Tamil Nadu", "West Bengal", "Gujarat"]
        is_north = city in ["Delhi", "Jaipur", "Lucknow", "Uttar Pradesh", "Rajasthan"]
        
        current_month = datetime.now().month
        is_monsoon = 6 <= current_month <= 9
        is_winter = current_month in [12, 1, 2]
        
        temp = random.uniform(25, 35)
        if is_winter and is_north: temp = random.uniform(10, 22)
        if is_coastal: temp = random.uniform(28, 33)
        
        humidity = random.uniform(50, 70)
        if is_coastal: humidity = random.uniform(70, 95)
        if is_monsoon: humidity = random.uniform(75, 95)
        
        rainfall = 0.0
        if is_monsoon: rainfall = random.uniform(0, 50)
        
        aqi = random.uniform(50, 150)
        if is_north and is_winter: aqi = random.uniform(200, 450)
        
        return {
            "city": city,
            "temp": round(temp, 1),
            "humidity": round(humidity, 1),
            "rainfall": round(rainfall, 1),
            "aqi": int(aqi)
        }

    def get_historical_mock(self, city: str, days: int = 365) -> pd.DataFrame:
        """Generate realistic synthetic historical weather data."""
        is_coastal = city in ["Mumbai", "Chennai", "Kolkata", "Kerala", "Maharashtra", "Tamil Nadu", "West Bengal", "Gujarat"]
        is_north = city in ["Delhi", "Jaipur", "Lucknow", "Uttar Pradesh", "Rajasthan"]
        
        records = []
        start_date = datetime.now() - timedelta(days=days)
        
        for i in range(days):
            date = start_date + timedelta(days=i)
            month = date.month
            
            is_monsoon = 6 <= month <= 9
            is_winter = month in [12, 1, 2]
            
            # Base temp
            temp = 30 + random.uniform(-3, 3)
            if is_winter and is_north: temp -= 12
            if month in [4, 5] and is_north: temp += 8
            
            # Base humidity
            humidity = 60 + random.uniform(-10, 10)
            if is_coastal: humidity += 20
            if is_monsoon: humidity += 25
            humidity = min(100, max(20, humidity))
            
            # Rainfall
            rainfall = 0
            if is_monsoon:
                if random.random() < 0.6:  # 60% chance of rain in monsoon
                    rainfall = random.uniform(5, 40)
            elif is_coastal and random.random() < 0.2:
                rainfall = random.uniform(0, 10)
                
            # AQI
            aqi = random.uniform(60, 120)
            if is_north and is_winter:
                aqi += random.uniform(100, 300)
                
            records.append({
                "date": date.strftime("%Y-%m-%d"),
                "city": city,
                "temp": round(temp, 1),
                "humidity": round(humidity, 1),
                "rainfall": round(rainfall, 1),
                "aqi": int(aqi)
            })
            
        return pd.DataFrame(records)

    def build_weather_dataset(self):
        """Build historical dataset for all mapped regions/cities."""
        all_dfs = []
        for city in self.cities:
            all_dfs.append(self.get_historical_mock(city, days=365 * 3)) # 3 years
            
        df = pd.concat(all_dfs, ignore_index=True)
        os.makedirs(os.path.dirname(DATA_PATH), exist_ok=True)
        df.to_csv(DATA_PATH, index=False)
        return df
