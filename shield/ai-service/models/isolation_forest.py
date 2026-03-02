import numpy as np
import joblib
from pathlib import Path
from sklearn.ensemble import IsolationForest
from utils.feature_extractor import extract_features, FEATURE_NAMES


MODEL_PATH = Path("/tmp/shield_isolation_forest.joblib")


class AnomalyDetector:
    """Isolation Forest based anomaly detector for access events."""

    def __init__(self):
        self.model: IsolationForest | None = None
        self.is_trained = False
        self._load_model()

    def _load_model(self):
        if MODEL_PATH.exists():
            try:
                self.model = joblib.load(MODEL_PATH)
                self.is_trained = True
            except Exception:
                self.model = None

    def train(self, events: list[dict]) -> dict:
        """Train on a list of access events (assumed normal)."""
        if len(events) < 10:
            return {"status": "error", "message": "Need at least 10 events for training"}

        X = np.array([extract_features(e) for e in events])
        self.model = IsolationForest(
            n_estimators=100,
            contamination=0.1,
            random_state=42,
            max_features=1.0,
        )
        self.model.fit(X)
        self.is_trained = True
        joblib.dump(self.model, MODEL_PATH)

        return {
            "status": "success",
            "samples_trained": len(events),
            "features": len(FEATURE_NAMES),
            "model_path": str(MODEL_PATH),
        }

    def predict(self, event: dict) -> dict:
        """Score a single access event for anomaly."""
        features = extract_features(event)

        if not self.is_trained or self.model is None:
            # Fallback: rule-based scoring when model not trained
            return self._rule_based_score(event, features)

        # Get anomaly score (-1 = anomaly, 1 = normal)
        score = self.model.decision_function(features.reshape(1, -1))[0]
        prediction = self.model.predict(features.reshape(1, -1))[0]

        anomaly_detected = prediction == -1
        # Normalize score to 0-100 risk
        risk_score = int(np.clip(50 - score * 200, 0, 100))

        return {
            "risk_score": risk_score,
            "anomaly_detected": anomaly_detected,
            "raw_score": float(score),
            "features": features.tolist(),
            "feature_names": FEATURE_NAMES,
        }

    def _rule_based_score(self, event: dict, features: np.ndarray) -> dict:
        """Fallback scoring when no model is available."""
        score = 10  # baseline
        reasons = []

        if not event.get("is_working_hours", True):
            score += 25
            reasons.append("Outside working hours")
        if not event.get("is_known_device", True):
            score += 20
            reasons.append("Unknown device")
        rate = event.get("request_rate_ratio", 1.0)
        if rate > 3:
            score += 15
            reasons.append(f"High request rate ({rate:.1f}x)")
        dist = event.get("distance_from_usual_location", 0)
        if dist > 100:
            score += 20
            reasons.append(f"Unusual location ({dist:.0f}km)")
        failed = event.get("failed_attempts_today", 0)
        if failed > 0:
            score += min(failed * 10, 40)
            reasons.append(f"{failed} failed attempts")

        score = min(100, max(0, score))

        return {
            "risk_score": score,
            "anomaly_detected": score > 50,
            "raw_score": 0.0,
            "features": features.tolist(),
            "feature_names": FEATURE_NAMES,
            "fallback": True,
            "reasons": reasons,
        }


# Singleton instance
detector = AnomalyDetector()
