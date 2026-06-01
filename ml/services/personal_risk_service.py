import os
import joblib
import pandas as pd
import numpy as np
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
from sklearn.preprocessing import StandardScaler
from sklearn.pipeline import Pipeline

MODELS_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "models")
os.makedirs(MODELS_DIR, exist_ok=True)

class PersonalRiskService:
    def __init__(self):
        self.diabetes_model_path = os.path.join(MODELS_DIR, "personal_risk_diabetes.pkl")
        self.heart_model_path = os.path.join(MODELS_DIR, "personal_risk_heart.pkl")
        self.stroke_model_path = os.path.join(MODELS_DIR, "personal_risk_stroke.pkl")
        self._ensure_models_exist()

    def _ensure_models_exist(self):
        if not os.path.exists(self.diabetes_model_path):
            self._train_diabetes_model()
        if not os.path.exists(self.heart_model_path):
            self._train_heart_model()
        if not os.path.exists(self.stroke_model_path):
            self._train_stroke_model()

    def _train_diabetes_model(self):
        # Generate synthetic data based on PIMA Indians Diabetes structure
        np.random.seed(42)
        n = 768
        X = pd.DataFrame({
            'age': np.random.randint(21, 80, n),
            'BMI': np.random.normal(32.0, 7.0, n),
            'glucose_level': np.random.normal(120.0, 30.0, n),
            'blood_pressure': np.random.normal(69.0, 19.0, n),
            'skin_thickness': np.random.normal(20.0, 15.0, n),
            'insulin': np.random.normal(80.0, 115.0, n),
            'family_history': np.random.choice([0, 1], n, p=[0.7, 0.3]),
            'physical_activity': np.random.choice([0, 1], n, p=[0.4, 0.6]) # 1 is active
        })
        # Simple risk logic
        risk = (X['glucose_level'] * 0.4 + X['BMI'] * 0.3 + X['age'] * 0.2 + X['family_history'] * 20 - X['physical_activity'] * 15) > 85
        y = risk.astype(int)
        
        model = Pipeline([
            ('scaler', StandardScaler()),
            ('clf', LogisticRegression())
        ])
        model.fit(X, y)
        joblib.dump(model, self.diabetes_model_path)

    def _train_heart_model(self):
        # Cleveland Heart Disease structure (~303 rows)
        np.random.seed(42)
        n = 303
        X = pd.DataFrame({
            'age': np.random.randint(29, 77, n),
            'sex': np.random.choice([0, 1], n),
            'chest_pain_type': np.random.choice([0, 1, 2, 3], n),
            'resting_bp': np.random.normal(131.0, 17.0, n),
            'cholesterol': np.random.normal(246.0, 51.0, n),
            'fasting_blood_sugar': np.random.choice([0, 1], n, p=[0.85, 0.15]),
            'ecg_result': np.random.choice([0, 1, 2], n),
            'max_hr': np.random.normal(149.0, 22.0, n),
            'exercise_angina': np.random.choice([0, 1], n),
            'oldpeak': np.random.normal(1.0, 1.1, n),
            'slope': np.random.choice([0, 1, 2], n),
            'vessels': np.random.choice([0, 1, 2, 3], n),
            'thal': np.random.choice([0, 1, 2, 3], n)
        })
        # Synthetic label logic
        risk = (X['age']*0.1 + X['resting_bp']*0.1 + X['cholesterol']*0.05 + X['exercise_angina']*20 + X['vessels']*10) > 40
        y = risk.astype(int)
        
        model = RandomForestClassifier(n_estimators=100, random_state=42)
        model.fit(X, y)
        joblib.dump({'model': model, 'features': list(X.columns)}, self.heart_model_path)

    def _train_stroke_model(self):
        # Kaggle Stroke Dataset structure (~5000 rows)
        np.random.seed(42)
        n = 5000
        X = pd.DataFrame({
            'age': np.random.randint(0, 82, n),
            'hypertension': np.random.choice([0, 1], n, p=[0.9, 0.1]),
            'heart_disease': np.random.choice([0, 1], n, p=[0.95, 0.05]),
            'ever_married': np.random.choice([0, 1], n),
            'work_type': np.random.choice([0, 1, 2, 3, 4], n),
            'residence_type': np.random.choice([0, 1], n),
            'avg_glucose_level': np.random.normal(106.0, 45.0, n),
            'BMI': np.random.normal(28.0, 7.0, n),
            'smoking_status': np.random.choice([0, 1, 2, 3], n) # 0=never, 1=former, 2=smokes, 3=unknown
        })
        risk = (X['age']*0.3 + X['hypertension']*30 + X['heart_disease']*30 + (X['smoking_status']==2)*15 + X['avg_glucose_level']*0.1) > 55
        y = risk.astype(int)
        
        model = GradientBoostingClassifier(random_state=42)
        model.fit(X, y)
        joblib.dump(model, self.stroke_model_path)

    def _categorize(self, prob):
        if prob < 0.33:
            return "Low"
        elif prob < 0.66:
            return "Moderate"
        return "High"

    def predict_all(self, user_data: dict) -> dict:
        """Run all 3 models and return combined report"""
        
        # Diabetes
        diab_model = joblib.load(self.diabetes_model_path)
        diab_features = [[
            user_data.get('age', 40),
            user_data.get('weight', 70) / ((user_data.get('height', 170)/100)**2), # BMI
            user_data.get('glucose_level', 100),
            user_data.get('systolic_bp', 120),
            20, # skin thickness dummy
            80, # insulin dummy
            1 if user_data.get('family_diabetes', False) else 0,
            user_data.get('physical_activity', 1)
        ]]
        diab_prob = diab_model.predict_proba(diab_features)[0][1]
        
        # Heart Disease
        heart_data = joblib.load(self.heart_model_path)
        heart_model = heart_data['model']
        heart_features_list = heart_data['features']
        
        heart_vec = pd.DataFrame([{
            'age': user_data.get('age', 40),
            'sex': 1 if user_data.get('sex', 'male').lower() == 'male' else 0,
            'chest_pain_type': user_data.get('chest_pain', 0),
            'resting_bp': user_data.get('systolic_bp', 120),
            'cholesterol': user_data.get('cholesterol', 200),
            'fasting_blood_sugar': 1 if user_data.get('glucose_level', 100) > 120 else 0,
            'ecg_result': 0,
            'max_hr': 150,
            'exercise_angina': 0,
            'oldpeak': 0,
            'slope': 1,
            'vessels': 0,
            'thal': 2
        }])[heart_features_list]
        heart_prob = heart_model.predict_proba(heart_vec)[0][1]
        
        # Stroke
        stroke_model = joblib.load(self.stroke_model_path)
        stroke_features = pd.DataFrame([{
            'age': user_data.get('age', 40),
            'hypertension': 1 if user_data.get('systolic_bp', 120) > 140 else 0,
            'heart_disease': 1 if user_data.get('family_heart', False) else 0,
            'ever_married': 1,
            'work_type': 2,
            'residence_type': 1,
            'avg_glucose_level': user_data.get('glucose_level', 100),
            'BMI': user_data.get('weight', 70) / ((user_data.get('height', 170)/100)**2),
            'smoking_status': 2 if user_data.get('smoking', False) else 0
        }])
        stroke_prob = stroke_model.predict_proba(stroke_features)[0][1]

        return {
            "diabetes": {
                "risk_probability": float(diab_prob),
                "risk_category": self._categorize(diab_prob),
            },
            "heart_disease": {
                "risk_probability": float(heart_prob),
                "risk_category": self._categorize(heart_prob),
                "top_3_risk_factors": ["Age", "Blood Pressure", "Cholesterol"] # simplified for demo
            },
            "stroke": {
                "risk_probability": float(stroke_prob),
                "risk_category": self._categorize(stroke_prob)
            }
        }
