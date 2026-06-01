import os
import pandas as pd
import numpy as np
import hashlib

RAW_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data", "raw")
PROCESSED_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data", "processed")

def hash_identifier(val):
    return hashlib.sha256(str(val).encode()).hexdigest()[:12]

def run_pipeline():
    print("Starting data preprocessing pipeline...")
    input_file = os.path.join(RAW_DIR, 'synthetic_outbreak_data.csv')
    
    if not os.path.exists(input_file):
        print("Raw data not found. Please run download_datasets.py first.")
        return
        
    df = pd.read_csv(input_file)
    
    # Normalize column names
    df.columns = [c.strip().lower().replace(" ", "_") for c in df.columns]
    
    # Convert date
    df['date'] = pd.to_datetime(df['date'])
    df = df.sort_values(by=['region', 'disease', 'date'])
    
    # Handle missing values (forward fill)
    df = df.ffill()
    
    # Anonymization / Privacy Layer
    # Hash region to simulate PII removal
    df['region_hash'] = df['region'].apply(hash_identifier)
    # Add noise to cases (+/- 2%)
    noise_factor = np.random.uniform(0.98, 1.02, size=len(df))
    df['cases_anonymized'] = (df['cases'] * noise_factor).astype(int)
    
    # Feature Engineering
    df['week_of_year'] = df['date'].dt.isocalendar().week
    df['month'] = df['date'].dt.month
    df['is_monsoon_season'] = df['month'].apply(lambda x: 1 if 6 <= x <= 9 else 0)
    
    # Rolling averages (per region, per disease)
    df['rolling_7day_avg'] = df.groupby(['region', 'disease'])['cases_anonymized'].transform(lambda x: x.rolling(window=1, min_periods=1).mean()) # using 1 since data is weekly, technically this would be 1-week
    df['rolling_30day_avg'] = df.groupby(['region', 'disease'])['cases_anonymized'].transform(lambda x: x.rolling(window=4, min_periods=1).mean()) # 4 weeks approx 30 days
    
    # Output to Parquet
    output_file = os.path.join(PROCESSED_DIR, 'outbreak_processed.parquet')
    df.to_parquet(output_file, index=False)
    
    print(f"Pipeline complete. Processed {len(df)} records.")
    print(f"Output saved to {output_file}")

if __name__ == "__main__":
    run_pipeline()
