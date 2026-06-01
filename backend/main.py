from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api import data, predictions, environment, symptoms, dashboard, alerts
import asyncio
import logging

logger = logging.getLogger(__name__)

app = FastAPI(title="Helix Backend API", version="1.0.0")

# Setup CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(data.router,        prefix="/api/data",        tags=["data"])
app.include_router(predictions.router, prefix="/api/predictions", tags=["predictions"])
app.include_router(environment.router, prefix="/api/environment", tags=["environment"])
app.include_router(symptoms.router,    prefix="/api/symptoms",    tags=["symptoms"])
app.include_router(dashboard.router,   prefix="/api/dashboard",   tags=["dashboard"])
app.include_router(alerts.router,      prefix="/api/alerts",      tags=["alerts"])


async def _alert_monitor_loop():
    """Background task: run check_all_regions() every 300 seconds."""
    # Lazy import to avoid circular issues
    from app.services.alert_engine import AlertEngine
    engine = AlertEngine()
    while True:
        try:
            count = engine.check_all_regions()
            logger.info(f"[AlertMonitor] Cycle complete — {count} alerts generated/updated.")
        except Exception as e:
            logger.error(f"[AlertMonitor] Error: {e}")
        await asyncio.sleep(300)   # 5-minute interval


@app.on_event("startup")
async def startup_event():
    """Auto-initialize DB and launch alert monitoring background task."""
    try:
        from init_db import init_db
        init_db()
        logger.info("Database initialized successfully.")
    except Exception as e:
        logger.warning(f"DB init warning: {e}")

    # Kick off the continuous alert monitor as a background asyncio task
    asyncio.create_task(_alert_monitor_loop())
    logger.info("Alert monitoring background task started (interval: 300s).")


@app.get("/health")
def health_check():
    return {"status": "ok", "service": "helix-backend", "phase": 8}
