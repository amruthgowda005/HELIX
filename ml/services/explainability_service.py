class ExplainabilityService:
    def __init__(self):
        pass

    def explain_outbreak_prediction(self, disease: str, region: str, prediction: float) -> dict:
        """Mocked SHAP TreeExplainer for outbreak predictions."""
        # Realistic feature impact based on disease
        if disease == "Dengue":
            features = [
                {"feature": "Rainfall (Last 7 Days)", "impact": 23.5, "value": "120mm"},
                {"feature": "Historical Trend", "impact": 18.2, "value": "Upward"},
                {"feature": "Active Cases in Region", "impact": 12.1, "value": "45"},
                {"feature": "Temperature", "impact": 8.4, "value": "32°C"},
                {"feature": "Humidity", "impact": -5.2, "value": "60%"},
            ]
            narrative = f"{disease} risk in {region} is elevated primarily due to heavy recent rainfall (+23.5% risk increase) and a strong historical upward trend (+18.2%)."
        elif disease == "Cholera":
            features = [
                {"feature": "Water Quality Index", "impact": 31.0, "value": "Poor"},
                {"feature": "Symptom Reports", "impact": 22.4, "value": "15 spikes"},
                {"feature": "Historical Trend", "impact": 15.5, "value": "Upward"},
                {"feature": "Rainfall (Last 7 Days)", "impact": 10.2, "value": "80mm"},
                {"feature": "Temperature", "impact": -2.1, "value": "28°C"},
            ]
            narrative = f"{disease} risk in {region} is driven by poor water quality metrics (+31.0%) and a recent surge in related symptom reports (+22.4%)."
        else:
            features = [
                {"feature": "Symptom Reports", "impact": 25.0, "value": "High"},
                {"feature": "Historical Trend", "impact": 20.1, "value": "Upward"},
                {"feature": "Population Density", "impact": 10.5, "value": "High"},
                {"feature": "Temperature", "impact": 5.2, "value": "Normal"},
                {"feature": "Humidity", "impact": -3.1, "value": "Normal"},
            ]
            narrative = f"The model predicts higher {disease} risk in {region} mainly due to clustered symptom reports (+25.0%) and historical seasonal patterns (+20.1%)."

        return {
            "prediction": prediction,
            "top_features": features,
            "narrative": narrative
        }

    def explain_personal_risk(self, condition: str, user_data: dict, prediction: float) -> dict:
        """Mocked SHAP waterfall for personal risk models."""
        features = []
        narrative = ""
        
        if condition.lower() == "diabetes":
            bmi = user_data.get('weight', 75) / ((user_data.get('height', 175) / 100) ** 2)
            features = [
                {"feature": "BMI", "impact": round((bmi - 22) * 1.5, 1), "value": round(bmi, 1)},
                {"feature": "Age", "impact": round((user_data.get('age', 40) - 30) * 0.5, 1), "value": user_data.get('age', 40)},
                {"feature": "Physical Activity", "impact": -15.0 if user_data.get('physical_activity') == 1 else 10.0, "value": "Active" if user_data.get('physical_activity') == 1 else "Sedentary"}
            ]
            narrative = f"Your BMI of {round(bmi,1)} adds +{features[0]['impact']}% to your baseline risk. "
            if user_data.get('physical_activity') == 1:
                narrative += "However, your active lifestyle reduces the risk by 15%."
        
        return {
            "condition": condition,
            "prediction": prediction,
            "features": features,
            "narrative": narrative
        }

    def explain_alert(self, alert_data: dict) -> dict:
        """Generates human-readable explanation of why an alert triggered."""
        severity = alert_data.get('severity', 'HIGH')
        disease = alert_data.get('disease', 'Unknown')
        
        narrative = f"This {severity} alert for {disease} was triggered by the Anomaly Detection Engine. "
        if severity == "CRITICAL":
            narrative += "The Z-Score exceeded 3.0, indicating a statistically significant spike in cases that deviates heavily from the 30-day moving average. Immediate public health intervention is recommended."
        else:
            narrative += "A localized cluster of symptom reports combined with favorable environmental conditions pushed the risk score above the standard threshold."
            
        return {
            "alert_id": alert_data.get('id'),
            "explanation": narrative,
            "key_factors": ["Z-Score Anomaly", "Symptom Clustering", "Environmental Multiplier"]
        }
