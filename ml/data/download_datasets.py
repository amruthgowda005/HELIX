import os
import pandas as pd
import numpy as np
import requests
from datetime import timedelta, date
import random

RAW_DIR = os.path.join(os.path.dirname(__file__), "raw")
PROCESSED_DIR = os.path.join(os.path.dirname(__file__), "processed")

os.makedirs(RAW_DIR, exist_ok=True)
os.makedirs(PROCESSED_DIR, exist_ok=True)

DISEASES = ['Dengue', 'Malaria', 'Cholera', 'Influenza', 'COVID-19']
REGIONS = ['Maharashtra', 'Karnataka', 'Delhi', 'Tamil Nadu', 'Kerala', 
           'Gujarat', 'Uttar Pradesh', 'West Bengal', 'Rajasthan', 'Telangana']

def fetch_who_data():
    try:
        url = "https://ghoapi.azureedge.net/api/Indicator"
        response = requests.get(url, timeout=5)
        if response.status_code == 200:
            print("Successfully connected to WHO GHO API.")
            # Note: The WHO API returns list of indicators. 
            # For a realistic outbreak dataset with regions/cases, we use the fallback.
            return True
    except Exception as e:
        print(f"Failed to fetch WHO data: {e}")
    return False

def generate_synthetic_data():
    print("Generating synthetic outbreak data (fallback)...")
    records = []
    
    start_date = date.today() - timedelta(days=3*365)
    
    # Generate weekly data
    for week in range(52 * 3):
        current_date = start_date + timedelta(weeks=week)
        month = current_date.month
        
        # Determine season modifier (Monsoon in India is approx June(6) to Sept(9))
        is_monsoon = 1 if 6 <= month <= 9 else 0
        is_winter = 1 if month in [11, 12, 1, 2] else 0
        
        for region in REGIONS:
            pop = random.randint(30000000, 200000000)
            
            for disease in DISEASES:
                # Base cases
                base = random.randint(10, 100)
                
                # Seasonal effects
                if disease in ['Dengue', 'Malaria'] and is_monsoon:
                    base *= random.uniform(3.0, 8.0)
                elif disease == 'Influenza' and is_winter:
                    base *= random.uniform(2.0, 5.0)
                elif disease == 'Cholera' and is_monsoon:
                    base *= random.uniform(2.0, 4.0)
                elif disease == 'COVID-19':
                    # Random waves
                    base *= random.uniform(1.0, 5.0)
                
                cases = int(base)
                deaths = int(cases * random.uniform(0.01, 0.05))
                recovered = int(cases * random.uniform(0.8, 0.95))
                
                records.append({
                    'date': current_date.strftime("%Y-%m-%d"),
                    'region': region,
                    'disease': disease,
                    'cases': cases,
                    'deaths': deaths,
                    'recovered': recovered,
                    'population': pop
                })
                
    df = pd.DataFrame(records)
    output_path = os.path.join(RAW_DIR, 'synthetic_outbreak_data.csv')
    df.to_csv(output_path, index=False)
    print(f"Generated {len(df)} rows. Saved to {output_path}")

if __name__ == "__main__":
    fetch_who_data()
    generate_synthetic_data()
