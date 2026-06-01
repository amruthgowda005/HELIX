# Helix

**Project Name:** Helix
**Repo:** https://github.com/amruthgowda005/HELIX
**Tech Stack:**
- **Backend:** FastAPI, SQLite
- **Frontend:** React + Vite + Tailwind CSS + Recharts
- **ML Service:** Python, ARIMA (pmdarima/statsmodels), Prophet, scikit-learn, TensorFlow

## Project Structure
```
helix/
├── backend/
│   ├── app/
│   │   ├── api/
│   │   │   ├── data.py
│   │   │   ├── predictions.py
│   │   │   ├── environment.py
│   │   │   ├── symptoms.py
│   │   │   └── dashboard.py        ← NEW (Phase 7)
│   │   ├── models/
│   │   │   ├── database.py
│   │   │   └── models.py
│   │   └── services/
│   ├── init_db.py
│   ├── main.py
│   ├── requirements.txt
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Sidebar.tsx         (react-router-dom navigation)
│   │   │   ├── Header.tsx
│   │   │   ├── Layout.tsx
│   │   │   ├── PredictionChart.tsx
│   │   │   ├── EnvironmentalPanel.tsx
│   │   │   ├── SymptomTrends.tsx
│   │   │   └── ModelMetricsCard.tsx
│   │   ├── pages/
│   │   │   ├── Dashboard.tsx       ← NEW (Phase 7)
│   │   │   ├── OutbreakMap.tsx     ← NEW (Phase 7)
│   │   │   └── SymptomChecker.tsx
│   │   ├── hooks/
│   │   │   └── useOutbreakData.ts
│   │   ├── App.tsx                 (react-router-dom Routes)
│   │   └── main.tsx                (BrowserRouter wrapper)
│   ├── tailwind.config.js
│   └── index.css
├── ml/
│   ├── data/
│   │   ├── raw/
│   │   ├── processed/
│   │   └── download_datasets.py
│   ├── models/              (ARIMA & Prophet .pkl artifacts)
│   ├── services/
│   │   ├── arima_model.py
│   │   ├── prophet_model.py
│   │   ├── lstm_model.py
│   │   ├── prediction_service.py
│   │   ├── data_pipeline.py
│   │   ├── weather_service.py
│   │   ├── correlation_engine.py
│   │   ├── symptom_clustering.py
│   │   └── mock_symptom_data.py
│   ├── main.py
│   ├── train_all.py
│   └── requirements.txt
├── start.sh
├── start.ps1
├── CONTEXT.md
└── README.md
```

## Decisions
- **Infrastructure:** No Docker — run with `start.sh` or `start.ps1`.
- **UI/UX:** Dark theme (#0A0F1E background, #00D4FF accent). Font: Inter.
- **Data Strategy:** Data pipeline established, `synthetic_outbreak_data.csv` created.
- **Database:** SQLite DB with 4 tables initialized and seeded (7,800 records).
- **Datasets:** WHO GHO API (primary), synthetic fallback (secondary).
- **ML Models:** ARIMA + Prophet + LSTM implemented with ensemble prediction service (30%, 30%, 40% weights). Prophet now leverages rainfall and humidity as active regressors.
- **Environmental Engine:** `weather_service.py` connects to OpenWeatherMap API with custom historical fallbacks. `correlation_engine.py` calculates Pearson/Spearman lag correlations and outputs dynamic weather risk multipliers (e.g. 1.56x) for active predictions.
- **Symptom Intelligence:** Symptom reporting API with hashlib region anonymization. DBSCAN clustering detects regional symptom groupings (e.g. Cholera in Mumbai), Z-score alerts active spikes, and a rule-based + ML classifier maps symptoms to likely disease prognosis.
- **Geo-Spatial Map:** Interactive Leaflet map with CartoDB Dark Matter tiles. CircleMarkers for 10 Indian cities, color-coded by risk score (green/yellow/orange/red). Disease filter dropdown and pulsing "LIVE DATA FEED" badge. Popups show city details, active cases, dominant pathogen, risk index, and 7-day trend.
- **Dashboard:** Full dark-theme dashboard with 4 KPI cards (Total Active Cases, High-Risk Zones, Active Alerts, Prediction Accuracy), Pathogen Outbreak Waveforms area chart, Climate-Driven Risk Grid table, and embedded EnvironmentalPanel, SymptomTrends, and PredictionChart widgets. 30-second auto-refresh with skeleton loaders.
- **Navigation:** react-router-dom with BrowserRouter. Routes: `/` (Dashboard), `/map` (OutbreakMap), `/symptoms` (SymptomChecker). Active route highlighted in sidebar with electric blue left border.
- **API Endpoints:** `/api/dashboard/summary` returns all KPI data in a single call (total_active_cases, high_risk_regions, alerts_today, prediction_accuracy, region_risk_matrix with lat/lng for map plotting).
- **ML Service:** Endpoints at :8001 proxied through backend at :8000. Includes `/api/environment/*`, `/api/symptoms/*`, and `/api/dashboard/*` routes.
- **Charting:** Recharts with historical + forecast lines, confidence bands, RMSE badges, real-time symptom trend surveillance, and pathogen waveform area charts.
- **Training:** `train_all.py` orchestrator script created for batch training all models.

## Phase Tracking
**Current Phase:** Phase 7 complete
**Next Phase:** Phase 8 — Early Warning Alert System
