from services.personal_risk_service import PersonalRiskService

class StrokeGuardEngine:
    def __init__(self):
        self.risk_svc = PersonalRiskService()

    def assess_neurological_risk(self, health_data: dict) -> dict:
        """Combines base ML stroke risk with active biometric/image/audio placeholders."""
        
        # 1. Base ML Risk
        base_assessment = self.risk_svc.predict_all(health_data)
        stroke_base_prob = base_assessment.get("stroke", {}).get("risk_probability", 0.0)
        
        # 2. Blood pressure trend analysis (simplified active monitoring modifier)
        bp_systolic = float(health_data.get('systolic_bp', 120))
        active_bp_modifier = 0
        if bp_systolic > 180:
            active_bp_modifier = 0.40  # Hypertensive crisis adds huge active risk
        elif bp_systolic > 140:
            active_bp_modifier = 0.15

        # 3. Facial asymmetry / Speech slurring placeholders
        # In Phase 14 this will accept raw images/audio. For now, mock based on flag.
        facial_flag = bool(health_data.get("facial_asymmetry_detected", False))
        speech_flag = bool(health_data.get("speech_slurring_detected", False))
        
        cv_nlp_modifier = 0
        if facial_flag: cv_nlp_modifier += 0.30
        if speech_flag: cv_nlp_modifier += 0.35

        # Composite Neural Risk
        total_risk = min(1.0, stroke_base_prob + active_bp_modifier + cv_nlp_modifier)
        
        # Determine strict urgency bands (F.A.S.T protocol triggers)
        triage_level = "ROUTINE"
        if total_risk > 0.8 or (facial_flag or speech_flag):
            triage_level = "CRITICAL_EMERGENCY"
        elif total_risk > 0.5 or bp_systolic > 180:
            triage_level = "URGENT"
        elif total_risk > 0.25:
            triage_level = "MONITOR"

        return self.get_risk_report(total_risk, triage_level, facial_flag, speech_flag, bp_systolic)

    def get_risk_report(self, risk_score: float, triage_level: str, facial: bool, speech: bool, bp: float) -> dict:
        """Generates structured JSON report with actionable protocol."""
        actions = []
        if triage_level == "CRITICAL_EMERGENCY":
            actions.append("IMMEDIATE ACTION REQUIRED: Call emergency services (108).")
            actions.append("Do not let the patient sleep or consume food/water.")
        elif triage_level == "URGENT":
            actions.append("Contact primary care physician immediately.")
            actions.append("Rest and monitor blood pressure every 30 minutes.")
        else:
            actions.append("Maintain healthy lifestyle.")
            if bp > 130:
                actions.append("Monitor blood pressure to keep it below 130/80.")

        return {
            "stroke_guard_score": round(risk_score * 100, 1),
            "triage_level": triage_level,
            "detected_anomalies": {
                "hypertensive": bp > 140,
                "facial_droop": facial,
                "speech_impairment": speech
            },
            "recommended_actions": actions,
            "fast_protocol_activated": triage_level == "CRITICAL_EMERGENCY"
        }
