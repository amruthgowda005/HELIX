from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api import data
import subprocess
import sys

app = FastAPI(title="Helix Backend", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(data.router, prefix="/api/data", tags=["data"])

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
