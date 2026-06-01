"""
Alert API — Phase 8: Early Warning Alert System
Endpoints: active alerts, history, resolve, test trigger, notifications poll.
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.models.database import get_db
from app.models.models import AlertLog, NotificationLog
from app.services.alert_engine import AlertEngine
from app.services.notification_service import NotificationService
from datetime import datetime

router = APIRouter()
engine = AlertEngine()
notif_svc = NotificationService()


def _alert_to_dict(a: AlertLog) -> dict:
    return {
        "id": a.id,
        "date": str(a.date),
        "region": a.region,
        "disease": a.disease,
        "severity": a.severity,
        "message": a.message,
        "resolved": a.resolved,
        "created_at": a.created_at.isoformat() if a.created_at else None,
    }


@router.get("/active")
def get_active_alerts(
    severity: str = Query(None, description="Filter by severity: CRITICAL|HIGH|MEDIUM|LOW"),
    db: Session = Depends(get_db),
):
    """Return all currently unresolved alerts sorted by severity."""
    alerts = engine.get_active_alerts(db, severity_filter=severity)
    return {"alerts": [_alert_to_dict(a) for a in alerts], "count": len(alerts)}


@router.get("/history")
def get_alert_history(
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db),
):
    """Paginated alert history (all alerts, including resolved)."""
    offset = (page - 1) * page_size
    total = db.query(AlertLog).count()
    alerts = (
        db.query(AlertLog)
        .order_by(AlertLog.created_at.desc())
        .offset(offset)
        .limit(page_size)
        .all()
    )
    return {
        "alerts": [_alert_to_dict(a) for a in alerts],
        "total": total,
        "page": page,
        "page_size": page_size,
        "pages": max(1, -(-total // page_size)),
    }


@router.post("/resolve/{alert_id}")
def resolve_alert(alert_id: int, db: Session = Depends(get_db)):
    """Mark an alert as resolved by ID."""
    alert = engine.resolve_alert(alert_id, db)
    if not alert:
        raise HTTPException(status_code=404, detail=f"Alert {alert_id} not found")
    return {"status": "resolved", "alert": _alert_to_dict(alert)}


@router.post("/test")
def trigger_test_alert(db: Session = Depends(get_db)):
    """Trigger a CRITICAL demo alert (Delhi Dengue) for hackathon demonstration."""
    alert = engine.trigger_test_alert(db)
    if alert:
        notif_svc.send_in_app(alert, db)
        notif_svc.send_email_mock(alert)
        return {"status": "test_alert_created", "alert": _alert_to_dict(alert)}
    return {"status": "alert_already_exists_today"}


@router.post("/run-check")
def run_alert_check():
    """Manually trigger the full region × disease alert check cycle."""
    count = engine.check_all_regions()
    return {"status": "check_complete", "alerts_generated": count}


@router.get("/notifications")
def get_notifications(
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
):
    """Poll for unread in-app notifications (used by NotificationBell)."""
    notifs = notif_svc.get_unread_notifications(db, limit=limit)
    return {
        "notifications": [
            {
                "id": n.id,
                "alert_id": n.alert_id,
                "message": n.message,
                "read": n.read,
                "created_at": n.created_at.isoformat() if n.created_at else None,
            }
            for n in notifs
        ],
        "unread_count": len(notifs),
    }


@router.post("/notifications/{notification_id}/read")
def mark_notification_read(notification_id: int, db: Session = Depends(get_db)):
    """Mark a notification as read."""
    success = notif_svc.mark_read(notification_id, db)
    if not success:
        raise HTTPException(status_code=404, detail="Notification not found")
    return {"status": "marked_read"}
