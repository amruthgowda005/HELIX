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
- **Early Warning Alert System:** Alert Engine with 4 severity levels (CRITICAL, HIGH, MEDIUM, LOW) and trigger rules based on risk score, case counts, and Z-score spikes. Background task runs every 5 minutes across all regions × diseases. Notification service handles in-app DB logging and mock email generation. Notification bell component in header with pulsing unread badge.
- **Personal Risk Engine:** 3 predictive ML models (Logistic Regression for Diabetes, Random Forest for Heart Disease, Gradient Boosting for Stroke) trained on synthetic cohorts. Computes individualized 0-100% risk scoring.
- **Personal Risk Dashboard:** 5-step interactive assessment wizard (Vitals, Lifestyle, Family History). Visualizes risk via dynamic semicircle risk gauge components and risk factor breakdowns. Integrated RiskSummaryCard on main dashboard.
- **Digital Health Twin:** `DigitalHealthTwin` class simulates 5-year health trajectories. `what_if()` models 4 interventions (lose_5kg, quit_smoking, exercise_30min_daily, reduce_bp_medication). Frontend page at `/twin` with side-by-side Recharts comparison of Current vs Improved Trajectory and "Potential risk reduction" callout.
- **Stroke Guard Neural Engine:** `StrokeGuardEngine` combines ML stroke risk with live BP analysis and placeholder CV/NLP modifiers (facial asymmetry + speech slurring — full implementation in Phase 14). F.A.S.T. protocol triage (CRITICAL_EMERGENCY / URGENT / MONITOR / ROUTINE).
- **Wearable Data Integration:** `WearableReading` table. POST `/api/wearables/ingest`, GET `/api/wearables/latest`, GET `/api/wearables/trends`. `wearable_simulator.py` script posts realistic vitals every 10s. `WearableVitalsWidget` on Dashboard with HR/SpO2 sparklines, daily steps, and sleep hours.
- **Demo Seed Script:** `backend/seed_demo.py` populates 3 CRITICAL/HIGH alerts, 200 symptom reports, and 144 wearable readings (24h). Run before any demo.
- **Integration Test:** `test_integration.py` tests 10 endpoints across backend + ML service. Run with `python test_integration.py`. Target >85% pass rate.
- **Navigation:** react-router-dom with BrowserRouter. Routes: `/` (Dashboard), `/map` (OutbreakMap), `/symptoms` (SymptomChecker), `/alerts` (Alerts Dashboard), `/risk` (PersonalRisk), `/twin` (HealthTwin). Sidebar with emoji icons and SET 1 COMPLETE badge.
- **API Endpoints:** `/api/dashboard/summary` returns all KPI data. `/api/alerts/*` endpoints provide active alerts, paginated history, resolution, and notification polling. `/api/personal/*` endpoints proxy ML personal risk assessments, stroke guard, and health twin. `/api/wearables/*` endpoints handle wearable data ingestion and retrieval.
- **ML Service:** Endpoints at :8001 proxied through backend at :8000. Includes `/api/environment/*`, `/api/symptoms/*`, `/api/dashboard/*`, `/api/personal/*` routes.
- **Charting:** Recharts with historical + forecast lines, confidence bands, RMSE badges, real-time symptom trend surveillance, pathogen waveform area charts, and health twin trajectory line charts.
- **Training:** `train_all.py` orchestrator script created for batch training all models.
- **Explainability (XAI):** Full SHAP-based model intelligence implemented. `ExplainabilityService` provides feature impacts and plain English narratives. `WhyThisPrediction` collapsible component attached to all predictions (outbreaks, personal risk) and alerts. Dashboard includes `ModelIntelligenceWidget` showing global feature importance. `FeatureImportanceChart` created for detailed matrix views.

## Phase Tracking
**Current Phase:** Phase 11 complete — SHAP Explainability Integrated
**Next Phase:** Phase 12 — Validated Accuracy Metrics Dashboard
