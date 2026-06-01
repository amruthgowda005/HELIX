from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api import data, predictions, environment, symptoms
import subprocess
import sys


app = FastAPI(title="Helix Backend API", version="1.0.0")

# Setup CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(data.router, prefix="/api/data", tags=["data"])
app.include_router(predictions.router, prefix="/api/predictions", tags=["predictions"])
app.include_router(environment.router, prefix="/api/environment", tags=["environment"])
app.include_router(symptoms.router, prefix="/api/symptoms", tags=["symptoms"])

@app.on_event("startup")
async def startup_event():
    """Auto-initialize and seed the database on startup."""
    try:
        from init_db import init_db
        init_db()
    except Exception as e:
        print(f"DB init warning: {e}")

@app.get("/health")
def health_check():
    return {"status": "ok", "service": "helix-backend"}
