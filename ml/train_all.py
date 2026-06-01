import os
import sys
import pandas as pd
from tabulate import tabulate
from services.arima_model import ARIMAForecast
from services.prophet_model import ProphetForecast
from services.lstm_model import LSTMForecast

DATA_PATH = os.path.join(os.path.dirname(__file__), "data", "processed", "outbreak_processed.parquet")

def train_all_models():
    print("Starting Training Orchestrator...")
    
    if not os.path.exists(DATA_PATH):
        print(f"Processed data not found at {DATA_PATH}. Please run data pipeline first.")
        return

    df = pd.read_parquet(DATA_PATH)
    diseases = df["disease"].unique()
    regions = df["region"].unique()
    
    results = []

    total_combinations = len(diseases) * len(regions)
    current = 0

    for disease in diseases:
        for region in regions:
            current += 1
            print(f"\n--- Training {disease} / {region} ({current}/{total_combinations}) ---")
            
            # ARIMA
            print(f"Training ARIMA for {disease}/{region}...")
            arima = ARIMAForecast().fit(disease, region)
            
            # Prophet
            print(f"Training Prophet for {disease}/{region}...")
            prophet = ProphetForecast().fit(disease, region)
            
            # LSTM
            print(f"Training LSTM for {disease}/{region}...")
            lstm = LSTMForecast().fit(disease, region, epochs=50, batch_size=16)
            
            # Find best model
            rmses = {
                "ARIMA": arima.rmse if arima.rmse else float('inf'),
                "Prophet": prophet.rmse if prophet.rmse else float('inf'),
                "LSTM": lstm.rmse if lstm.rmse else float('inf')
            }
            best_model = min(rmses, key=rmses.get)
            
            results.append([
                disease,
                region,
                f"{rmses['ARIMA']:.2f}" if rmses['ARIMA'] != float('inf') else "N/A",
                f"{rmses['Prophet']:.2f}" if rmses['Prophet'] != float('inf') else "N/A",
                f"{rmses['LSTM']:.2f}" if rmses['LSTM'] != float('inf') else "N/A",
                best_model
            ])

    print("\n\n" + "="*80)
    print("TRAINING COMPLETE - MODEL PERFORMANCE SUMMARY")
    print("="*80)
    headers = ["Disease", "Region", "ARIMA RMSE", "Prophet RMSE", "LSTM RMSE", "Best Model"]
    print(tabulate(results, headers=headers, tablefmt="grid"))
    
    print("\nModel artifacts saved to ml/models/")

if __name__ == "__main__":
    train_all_models()
