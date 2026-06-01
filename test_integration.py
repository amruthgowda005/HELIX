import requests
import time

def test_integration():
    print("========================================")
    print("HELIX — Phase 10 Core Integration Test")
    print("========================================\n")
    
    BASE_URL = "http://localhost:8000"
    ML_URL = "http://localhost:8001"
    
    tests = [
        {"name": "Backend Health Check", "url": f"{BASE_URL}/health", "method": "GET"},
        {"name": "ML Service Health Check", "url": f"{ML_URL}/health", "method": "GET"},
        {"name": "Data API", "url": f"{BASE_URL}/api/data/outbreaks", "method": "GET"},
        {"name": "Prediction API", "url": f"{BASE_URL}/api/predictions/outbreak", "method": "POST", "body": {"disease": "Dengue", "region": "Delhi"}},
        {"name": "Symptom Classifier API", "url": f"{BASE_URL}/api/symptoms/report", "method": "POST", "body": {"symptoms": ["fever", "cough"]}},
        {"name": "Alerts API", "url": f"{BASE_URL}/api/alerts/active", "method": "GET"},
        {"name": "Personal Risk API", "url": f"{BASE_URL}/api/personal/risk-assessment", "method": "POST", "body": {"age": 40, "weight": 75, "height": 175}},
        {"name": "Health Twin API", "url": f"{BASE_URL}/api/personal/health-twin", "method": "POST", "body": {"age": 40, "weight": 75, "height": 175}},
        {"name": "Stroke Guard API", "url": f"{BASE_URL}/api/personal/stroke-guard", "method": "POST", "body": {"age": 60, "systolic_bp": 150}},
        {"name": "Wearable Ingest API", "url": f"{BASE_URL}/api/wearables/ingest", "method": "POST", "body": {"heart_rate": 75}}
    ]

    passed = 0
    
    for t in tests:
        try:
            print(f"Testing {t['name']}...", end=" ")
            if t['method'] == "GET":
                r = requests.get(t['url'], timeout=5)
            else:
                r = requests.post(t['url'], json=t.get('body', {}), timeout=15)
                
            if r.status_code == 200:
                print("✅ PASS")
                passed += 1
            else:
                print(f"❌ FAIL (Status {r.status_code})")
        except Exception as e:
            print(f"❌ FAIL ({e})")
            
        time.sleep(0.5)

    score = (passed / len(tests)) * 100
    print("\n========================================")
    print(f"TOTAL SCORE: {score}% ({passed}/{len(tests)} passed)")
    print("========================================")
    
    if score >= 85:
        print("Set 1 Core Features — Integration SUCCESS 🚀")
    else:
        print("Set 1 Core Features — Integration FAILED ⚠️")

if __name__ == "__main__":
    test_integration()
