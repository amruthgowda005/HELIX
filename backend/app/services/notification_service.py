"""
NotificationService — Phase 8: Early Warning Alert System
Handles in-app notifications and mock email logging for hackathon demo.
"""
import logging
from datetime import datetime
from pathlib import Path
from sqlalchemy.orm import Session
from app.models.models import AlertLog, NotificationLog

logger = logging.getLogger(__name__)

NOTIFICATION_LOG_PATH = Path(__file__).parent.parent.parent / "notifications_log.txt"

SEVERITY_EMOJI = {
    "CRITICAL": "🔴",
    "HIGH":     "🟠",
    "MEDIUM":   "🟡",
    "LOW":      "🟢",
}

RECOMMENDED_ACTIONS = {
    "CRITICAL": "Activate Emergency Response Protocol. Notify District Health Officer immediately.",
    "HIGH":     "Issue public health advisory. Increase surveillance in affected area.",
    "MEDIUM":   "Monitor situation closely. Prepare resource inventory.",
    "LOW":      "Continue passive surveillance.",
}


class NotificationService:
    def format_alert_message(self, alert: AlertLog) -> str:
        """Format a structured alert message with severity badge and action guidance."""
        emoji = SEVERITY_EMOJI.get(alert.severity, "⚪")
        action = RECOMMENDED_ACTIONS.get(alert.severity, "")
        return (
            f"{emoji} [{alert.severity}] {alert.disease} Alert — {alert.region}\n"
            f"Risk message: {alert.message}\n"
            f"Recommended Action: {action}\n"
            f"Triggered: {alert.created_at or datetime.utcnow()}"
        )

    def send_in_app(self, alert: AlertLog, db: Session) -> NotificationLog:
        """Persist an in-app notification record to the DB for frontend polling."""
        formatted = self.format_alert_message(alert)
        notif = NotificationLog(
            alert_id=alert.id,
            channel="in_app",
            recipient="system",
            message=formatted,
            read=False,
        )
        db.add(notif)
        db.commit()
        db.refresh(notif)
        logger.info(f"In-app notification created for alert {alert.id}")
        return notif

    def send_email_mock(self, alert: AlertLog, recipient: str = "health-officer@helix.gov.in") -> str:
        """Log a mock email to console and notifications_log.txt (no real email for demo)."""
        formatted = self.format_alert_message(alert)
        log_entry = (
            f"\n{'='*60}\n"
            f"[MOCK EMAIL] To: {recipient}\n"
            f"Subject: ⚠️ Helix Alert — {alert.severity}: {alert.disease} in {alert.region}\n"
            f"Sent at: {datetime.utcnow().isoformat()}\n"
            f"Body:\n{formatted}\n"
            f"{'='*60}\n"
        )
        # Console
        logger.warning(log_entry)
        # File log
        try:
            with open(NOTIFICATION_LOG_PATH, "a", encoding="utf-8") as f:
                f.write(log_entry)
        except Exception as e:
            logger.error(f"Failed to write notification log: {e}")
        return log_entry

    def get_unread_notifications(self, db: Session, limit: int = 20):
        """Return unread in-app notifications, newest first."""
        return (
            db.query(NotificationLog)
            .filter(NotificationLog.channel == "in_app", NotificationLog.read == False)
            .order_by(NotificationLog.created_at.desc())
            .limit(limit)
            .all()
        )

    def mark_read(self, notification_id: int, db: Session) -> bool:
        """Mark a notification as read."""
        notif = db.query(NotificationLog).filter(NotificationLog.id == notification_id).first()
        if notif:
            notif.read = True
            db.commit()
            return True
        return False
