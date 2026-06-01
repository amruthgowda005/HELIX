class DigitalHealthTwin:
    def __init__(self):
        pass

    def create_twin(self, user_profile: dict) -> dict:
        """Create a baseline digital twin state from user profile."""
        # Clean defaults
        age = int(user_profile.get('age', 40))
        weight = float(user_profile.get('weight', 75))
        height = float(user_profile.get('height', 175))
        bmi = weight / ((height / 100) ** 2)
        systolic_bp = float(user_profile.get('systolic_bp', 120))
        smoking = bool(user_profile.get('smoking', False))
        exercise_daily = user_profile.get('physical_activity', 0) == 1

        return {
            "baseline": {
                "age": age,
                "weight": weight,
                "height": height,
                "bmi": bmi,
                "systolic_bp": systolic_bp,
                "smoking": smoking,
                "exercise_daily": exercise_daily,
            }
        }

    def _calculate_risk(self, state: dict) -> dict:
        """Simple deterministic risk function for trajectory modeling without heavy ML."""
        # Base risks
        diab_risk = (state['bmi'] - 22) * 2 + (state['age'] - 30) * 0.5
        heart_risk = (state['systolic_bp'] - 110) * 0.8 + (state['age'] - 30) * 0.6
        stroke_risk = (state['systolic_bp'] - 115) * 1.0 + (state['age'] - 30) * 0.7

        # Modifiers
        if state['smoking']:
            heart_risk += 25
            stroke_risk += 35
        
        if state['exercise_daily']:
            diab_risk -= 15
            heart_risk -= 12
            stroke_risk -= 10

        return {
            "diabetes_risk": max(5, min(95, diab_risk)),
            "heart_risk": max(5, min(95, heart_risk)),
            "stroke_risk": max(5, min(95, stroke_risk))
        }

    def run_simulation(self, twin: dict, years: int = 5) -> list:
        """Projects health trajectory over n years assuming no intervention."""
        state = twin['baseline'].copy()
        trajectory = []
        
        for year in range(years + 1):
            risks = self._calculate_risk(state)
            trajectory.append({
                "year": f"Year {year}",
                "age": state['age'],
                "diabetes_risk": round(risks['diabetes_risk'], 1),
                "heart_risk": round(risks['heart_risk'], 1),
                "stroke_risk": round(risks['stroke_risk'], 1)
            })
            
            # Natural aging progression
            state['age'] += 1
            if not state['exercise_daily']:
                state['weight'] += 0.5  # gain 0.5kg/year if sedentary
                state['bmi'] = state['weight'] / ((state['height'] / 100) ** 2)
                state['systolic_bp'] += 1.2
            else:
                state['systolic_bp'] += 0.3

        return trajectory

    def what_if(self, twin: dict, intervention: str, years: int = 5) -> list:
        """Models impact of lifestyle changes."""
        state = twin['baseline'].copy()
        
        if intervention == "lose_5kg":
            state['weight'] -= 5
            state['bmi'] = state['weight'] / ((state['height'] / 100) ** 2)
            state['systolic_bp'] -= 4
        elif intervention == "quit_smoking":
            state['smoking'] = False
        elif intervention == "exercise_30min_daily":
            state['exercise_daily'] = True
            state['weight'] -= 2
            state['bmi'] = state['weight'] / ((state['height'] / 100) ** 2)
            state['systolic_bp'] -= 5
        elif intervention == "reduce_bp_medication":
            state['systolic_bp'] -= 15

        trajectory = []
        for year in range(years + 1):
            risks = self._calculate_risk(state)
            trajectory.append({
                "year": f"Year {year}",
                "age": state['age'],
                "diabetes_risk": round(risks['diabetes_risk'], 1),
                "heart_risk": round(risks['heart_risk'], 1),
                "stroke_risk": round(risks['stroke_risk'], 1)
            })
            
            state['age'] += 1
            if not state['exercise_daily']:
                state['weight'] += 0.5
                state['bmi'] = state['weight'] / ((state['height'] / 100) ** 2)
                state['systolic_bp'] += 1.2
            else:
                state['systolic_bp'] += 0.3
                
        return trajectory

    def get_trajectory(self, user_profile: dict) -> dict:
        """Full simulation package comparing baseline to improvements."""
        twin = self.create_twin(user_profile)
        baseline_traj = self.run_simulation(twin)
        
        return {
            "baseline": baseline_traj,
            "what_if": {
                "lose_5kg": self.what_if(twin, "lose_5kg"),
                "quit_smoking": self.what_if(twin, "quit_smoking"),
                "exercise_30min_daily": self.what_if(twin, "exercise_30min_daily"),
                "reduce_bp_medication": self.what_if(twin, "reduce_bp_medication")
            }
        }
