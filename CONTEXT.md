# Helix

**Project Name:** Helix
**Repo:** https://github.com/amruthgowda005/HELIX
**Tech Stack:**
- **Backend:** FastAPI, SQLite
- **Frontend:** React + Vite + Tailwind CSS
- **ML Service:** Python, scikit-learn, Prophet, TensorFlow

## Project Structure
```
helix/
├── backend/
│   ├── app/
│   │   ├── api/
│   │   ├── models/
│   │   └── services/
│   ├── main.py
│   ├── requirements.txt
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Sidebar.tsx
│   │   │   ├── Header.tsx
│   │   │   └── Layout.tsx
│   │   └── App.tsx
│   ├── tailwind.config.js
│   └── index.css
├── ml/
│   ├── data/
│   ├── models/
│   ├── services/
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

## Phase Tracking
**Current Phase:** Phase 1 complete
**Next Phase:** Phase 2 — Historical Data Pipeline + Privacy Layer
