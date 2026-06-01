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
- **ML Models:** ARIMA + Prophet implemented with ensemble prediction service.
- **ML Service:** Endpoints at :8001 proxied through backend at :8000.
- **Charting:** Recharts with historical + forecast lines, confidence bands, RMSE badges.

## Phase Tracking
**Current Phase:** Phase 3 complete
**Next Phase:** Phase 4 — LSTM Model
