import time
import requests
import random
from datetime import datetime

API_URL = "http://localhost:8000/api/wearables/ingest"

def simulate():
    print(f"Starting Wearable Simulator. Posting to {API_URL} every 10 seconds...")
    base_hr = 70
    base_spo2 = 98
    steps = 1500
    
    while True:
        try:
            hr = max(50, min(180, base_hr + random.randint(-5, 5)))
            spo2 = max(90, min(100, base_spo2 + random.randint(-1, 1)))
            steps += random.randint(0, 15)
            
            payload = {
                "device_id": "sim_device_1",
                "heart_rate": hr,
                "spo2": spo2,
                "steps": steps,
                "sleep_hours": 7.5,
                "timestamp": datetime.utcnow().isoformat()
            }
            
            r = requests.post(API_URL, json=payload, timeout=5)
            print(f"[{datetime.now().strftime('%H:%M:%S')}] Ingested: HR={hr} | SpO2={spo2}% | Steps={steps} -> Response: {r.status_code}")
            
        except Exception as e:
            print(f"Error connecting to backend: {e}")
            
        time.sleep(10)

if __name__ == "__main__":
    simulate()
