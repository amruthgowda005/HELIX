"""
AlertEngine — Phase 8: Early Warning Alert System
Evaluates all 10 regions × 5 diseases and generates tiered severity alerts.
"""
from datetime import datetime, date, timedelta
from sqlalchemy.orm import Session
from app.models.models import AlertLog, OutbreakRecord
from app.models.database import SessionLocal
import logging

logger = logging.getLogger(__name__)

REGIONS = [
    {"region": "Delhi",     "risk_score": 82, "estimated_cases": 4500, "trend": "up"},
    {"region": "Mumbai",    "risk_score": 78, "estimated_cases": 3200, "trend": "up"},
    {"region": "Bangalore", "risk_score": 65, "estimated_cases": 1800, "trend": "stable"},
    {"region": "Chennai",   "risk_score": 58, "estimated_cases": 1100, "trend": "down"},
    {"region": "Kolkata",   "risk_score": 64, "estimated_cases": 1400, "trend": "up"},
    {"region": "Hyderabad", "risk_score": 50, "estimated_cases":  950, "trend": "stable"},
    {"region": "Pune",      "risk_score": 60, "estimated_cases":  800, "trend": "stable"},
    {"region": "Jaipur",    "risk_score": 48, "estimated_cases":  600, "trend": "down"},
    {"region": "Lucknow",   "risk_score": 50, "estimated_cases":  700, "trend": "up"},
    {"region": "Bhopal",    "risk_score": 40, "estimated_cases":  500, "trend": "down"},
]

DISEASES = ["Dengue", "Malaria", "Cholera", "Influenza", "COVID-19"]

DISEASE_RISK_WEIGHTS = {
    "Dengue":    {"Delhi": 82, "Mumbai": 45, "Bangalore": 35, "Chennai": 58, "Kolkata": 64, "Hyderabad": 40, "Pune": 25, "Jaipur": 48, "Lucknow": 50, "Bhopal": 30},
    "Malaria":   {"Delhi": 12, "Mumbai": 62, "Bangalore": 18, "Chennai": 44, "Kolkata": 52, "Hyderabad": 30, "Pune": 15, "Jaipur": 35, "Lucknow": 40, "Bhopal": 25},
    "Cholera":   {"Delhi":  5, "Mumbai": 78, "Bangalore": 12, "Chennai": 15, "Kolkata": 33, "Hyderabad": 22, "Pune":  8, "Jaipur": 10, "Lucknow": 15, "Bhopal": 12},
    "Influenza": {"Delhi": 33, "Mumbai": 15, "Bangalore": 48, "Chennai": 22, "Kolkata": 18, "Hyderabad": 35, "Pune": 60, "Jaipur": 28, "Lucknow": 30, "Bhopal": 40},
    "COVID-19":  {"Delhi": 41, "Mumbai": 22, "Bangalore": 65, "Chennai": 31, "Kolkata": 25, "Hyderabad": 50, "Pune": 45, "Jaipur": 20, "Lucknow": 25, "Bhopal": 35},
}

RECOMMENDED_ACTIONS = {
    "CRITICAL": "Activate Emergency Response Protocol. Notify District Health Officer immediately. Deploy rapid response teams.",
    "HIGH":     "Issue public health advisory. Increase surveillance in affected area. Alert local hospitals.",
    "MEDIUM":   "Monitor situation closely. Prepare resource inventory. Brief regional health coordinators.",
    "LOW":      "Continue passive surveillance. Schedule routine assessment for next week.",
}


def _compute_severity(risk_score: float, case_count: int, z_score: float = 0.0) -> str:
    """Determine alert severity from risk score, weekly case count, and optional z-score."""
    if risk_score > 85 or case_count > 500 or z_score > 3:
        return "CRITICAL"
    if risk_score > 65 or case_count > 200:
        return "HIGH"
    if risk_score > 40 or case_count > 50:
        return "MEDIUM"
    if risk_score > 20:
        return "LOW"
    return None  # Below monitoring threshold


class AlertEngine:
    def generate_alert(
        self,
        region: str,
        disease: str,
        trigger_data: dict,
        db: Session,
    ) -> AlertLog | None:
        """Create and persist an AlertLog entry if severity threshold is met."""
        risk_score = trigger_data.get("risk_score", 0)
        case_count = trigger_data.get("case_count", 0)
        z_score    = trigger_data.get("z_score", 0.0)

        severity = _compute_severity(risk_score, case_count, z_score)
        if severity is None:
            return None

        action  = RECOMMENDED_ACTIONS[severity]
        message = (
            f"[{severity}] {disease} alert in {region}. "
            f"Risk index: {risk_score}%. Estimated 7-day cases: {case_count}. "
            f"Z-score: {z_score:.2f}. {action}"
        )

        # Avoid duplicating alerts for same region+disease+severity on same day
        today = date.today()
        existing = (
            db.query(AlertLog)
            .filter(
                AlertLog.region == region,
                AlertLog.disease == disease,
                AlertLog.severity == severity,
                AlertLog.date == today,
                AlertLog.resolved == False,
            )
            .first()
        )
        if existing:
            return existing

        alert = AlertLog(
            date=today,
            region=region,
            disease=disease,
            severity=severity,
            message=message,
            resolved=False,
        )
        db.add(alert)
        db.commit()
        db.refresh(alert)
        logger.info(f"Alert generated: [{severity}] {disease} in {region}")
        return alert

    def check_all_regions(self):
        """Evaluate all 10 regions × 5 diseases and fire alerts where thresholds are met."""
        db: Session = SessionLocal()
        generated = 0
        try:
            for region_meta in REGIONS:
                region = region_meta["region"]
                base_risk = region_meta["risk_score"]
                base_cases = region_meta["estimated_cases"]

                for disease in DISEASES:
                    disease_risk = DISEASE_RISK_WEIGHTS.get(disease, {}).get(region, base_risk * 0.5)
                    # Blend regional base risk with disease-specific weight
                    blended_risk = round((base_risk * 0.4 + disease_risk * 0.6), 1)
                    estimated_weekly = int(base_cases * (disease_risk / 100) * 0.3)

                    trigger_data = {
                        "risk_score":  blended_risk,
                        "case_count":  estimated_weekly,
                        "z_score":     2.1 if region_meta["trend"] == "up" and blended_risk > 60 else 0.8,
                    }
                    alert = self.generate_alert(region, disease, trigger_data, db)
                    if alert:
                        generated += 1

        except Exception as e:
            logger.error(f"AlertEngine.check_all_regions error: {e}")
        finally:
            db.close()

        logger.info(f"Alert check complete — {generated} new alerts generated.")
        return generated

    def get_active_alerts(self, db: Session, severity_filter: str = None):
        """Return all unresolved alerts sorted by severity priority."""
        severity_order = {"CRITICAL": 0, "HIGH": 1, "MEDIUM": 2, "LOW": 3}
        query = db.query(AlertLog).filter(AlertLog.resolved == False)
        if severity_filter and severity_filter.upper() in severity_order:
            query = query.filter(AlertLog.severity == severity_filter.upper())
        alerts = query.all()
        return sorted(alerts, key=lambda a: severity_order.get(a.severity, 99))

    def resolve_alert(self, alert_id: int, db: Session) -> AlertLog | None:
        """Mark an alert as resolved."""
        alert = db.query(AlertLog).filter(AlertLog.id == alert_id).first()
        if alert:
            alert.resolved = True
            db.commit()
            db.refresh(alert)
        return alert

    def trigger_test_alert(self, db: Session) -> AlertLog:
        """Generate a demo CRITICAL alert for hackathon demonstrations."""
        return self.generate_alert(
            region="Delhi",
            disease="Dengue",
            trigger_data={"risk_score": 91, "case_count": 620, "z_score": 3.5},
            db=db,
        )
