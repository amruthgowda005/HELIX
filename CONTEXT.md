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
│   │   │   └── predictions.py
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
│   │   │   ├── Sidebar.tsx
│   │   │   ├── Header.tsx
│   │   │   ├── Layout.tsx
│   │   │   └── PredictionChart.tsx
│   │   ├── hooks/
│   │   │   └── useOutbreakData.ts
│   │   └── App.tsx
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
│   │   ├── prediction_service.py
│   │   └── data_pipeline.py
│   ├── main.py
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
- **ML Service:** Endpoints at :8001 proxied through backend at :8000. Includes `/api/environment/*` and `/api/symptoms/*` routes.
- **Charting:** Recharts with historical + forecast lines, confidence bands, RMSE badges, and real-time symptom trend surveillance.
- **Training:** `train_all.py` orchestrator script created for batch training all models.

## Phase Tracking
**Current Phase:** Phase 6 complete
**Next Phase:** Phase 7 — Geo-Spatial Heatmaps + Dashboard
