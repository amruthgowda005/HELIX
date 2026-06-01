import numpy as np
import pandas as pd
from sklearn.cluster import DBSCAN
from datetime import datetime, timedelta

SYMPTOMS_LIST = [
    "fever", "joint pain", "rash", "chills", "sweating",
    "diarrhea", "vomiting", "abdominal cramps", "cough", 
    "sore throat", "runny nose", "headache", "fatigue", 
    "nausea", "muscle ache", "shortness of breath", "loss of taste",
    "loss of smell", "shivering", "dehydration"
]

class SymptomClusteringEngine:
    def __init__(self):
        pass

    def preprocess_symptoms(self, reports: list) -> np.ndarray:
        """Convert symptom lists to feature vectors (binary one-hot)."""
        vectors = []
        for r in reports:
            # Handle list or comma separated string
            symptoms = r.get("symptoms", [])
            if isinstance(symptoms, str):
                symptoms = [s.strip().lower() for s in symptoms.split(",")]
            else:
                symptoms = [s.strip().lower() for s in symptoms]
                
            vec = [1 if sym in symptoms else 0 for sym in SYMPTOMS_LIST]
            vectors.append(vec)
            
        return np.array(vectors)

    def detect_clusters(self, region: str, reports: list) -> list:
        """Perform DBSCAN clustering on symptom reports to discover unusual symptom groupings."""
        if len(reports) < 3:
            return []
            
        vectors = self.preprocess_symptoms(reports)
        # DBSCAN clustering
        db = DBSCAN(eps=1.5, min_samples=2, metric="euclidean")
        labels = db.fit_predict(vectors)
        
        clusters = []
        unique_labels = set(labels)
        for label in unique_labels:
            if label == -1:
                continue # Outliers
                
            cluster_reports = [reports[i] for i in range(len(reports)) if labels[i] == label]
            
            # Find dominant symptoms in this cluster
            cluster_vectors = vectors[labels == label]
            symptom_freqs = cluster_vectors.sum(axis=0)
            dominant_indices = np.argsort(symptom_freqs)[::-1][:3]
            dominant_symptoms = [SYMPTOMS_LIST[idx] for idx in dominant_indices if symptom_freqs[idx] > 0]
            
            # Predict disease for the cluster dominant symptoms
            disease_classification = self.classify_disease(dominant_symptoms)
            
            clusters.append({
                "cluster_id": int(label),
                "region": region,
                "size": len(cluster_reports),
                "dominant_symptoms": dominant_symptoms,
                "estimated_disease": disease_classification["disease"],
                "confidence": disease_classification["confidence"]
            })
            
        return clusters

    def classify_disease(self, symptoms_list: list) -> dict:
        """Rule-based + ML classifier mapping symptoms to likely disease."""
        symptoms = [s.lower().strip() for s in symptoms_list]
        
        scores = {
            "Dengue": 0,
            "Malaria": 0,
            "Cholera": 0,
            "Influenza": 0,
            "COVID-19": 0
        }
        
        # Dengue: Fever + joint pain + rash
        if any(s in symptoms for s in ["fever", "high fever"]): scores["Dengue"] += 2
        if "joint pain" in symptoms or "bone pain" in symptoms: scores["Dengue"] += 3
        if "rash" in symptoms: scores["Dengue"] += 3
        if "headache" in symptoms: scores["Dengue"] += 1
        
        # Malaria: High fever + chills + sweating + shivering
        if any(s in symptoms for s in ["fever", "high fever"]): scores["Malaria"] += 2
        if "chills" in symptoms: scores["Malaria"] += 3
        if "sweating" in symptoms: scores["Malaria"] += 2
        if "shivering" in symptoms: scores["Malaria"] += 3
        
        # Cholera: Diarrhea + vomiting + abdominal cramps + dehydration
        if "diarrhea" in symptoms: scores["Cholera"] += 4
        if "vomiting" in symptoms: scores["Cholera"] += 3
        if "abdominal cramps" in symptoms: scores["Cholera"] += 2
        if "dehydration" in symptoms: scores["Cholera"] += 3
        
        # Influenza: Cough + sore throat + runny nose + fever
        if "cough" in symptoms: scores["Influenza"] += 2
        if "sore throat" in symptoms: scores["Influenza"] += 3
        if "runny nose" in symptoms: scores["Influenza"] += 3
        if "fever" in symptoms: scores["Influenza"] += 1
        if "fatigue" in symptoms: scores["Influenza"] += 1

        # COVID-19: Cough + shortness of breath + loss of taste/smell + fever
        if "cough" in symptoms: scores["COVID-19"] += 1
        if "shortness of breath" in symptoms: scores["COVID-19"] += 4
        if "loss of taste" in symptoms or "loss of smell" in symptoms: scores["COVID-19"] += 5
        if "fever" in symptoms: scores["COVID-19"] += 1
        
        # Select best disease
        best_disease = max(scores, key=scores.get)
        max_score = scores[best_disease]
        
        # Compute pseudo-confidence
        total_possible = {
            "Dengue": 9, "Malaria": 10, "Cholera": 12, "Influenza": 10, "COVID-19": 11
        }
        confidence = min(0.95, max(0.1, max_score / total_possible[best_disease]))
        
        # If no symptoms matched, default to low confidence Influenza
        if max_score == 0:
            return {"disease": "Unknown / Mild Illness", "confidence": 0.2}
            
        return {
            "disease": best_disease,
            "confidence": round(confidence, 2)
        }

    def detect_spike(self, region_reports: list, history_counts: list) -> dict:
        """Z-score based spike detection. Alert if >2.0 Z-score."""
        current_count = len(region_reports)
        
        if len(history_counts) < 5:
            # Insufficient history, fallback
            return {"is_spike": False, "z_score": 0.0, "current": current_count, "mean": current_count}
            
        mean = np.mean(history_counts)
        std = np.std(history_counts)
        
        if std == 0:
            std = 0.5 # avoid division by zero
            
        z_score = (current_count - mean) / std
        is_spike = z_score > 2.0
        
        return {
            "is_spike": bool(is_spike),
            "z_score": round(float(z_score), 2),
            "current": current_count,
            "mean": round(float(mean), 2),
            "threshold": round(float(mean + 2 * std), 2)
        }
