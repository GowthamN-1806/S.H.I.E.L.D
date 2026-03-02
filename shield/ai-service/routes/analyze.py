from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
from models.isolation_forest import detector
from models.behavioral_baseline import BehavioralBaseline
from utils.risk_calculator import calculate_risk

router = APIRouter()
baseline = BehavioralBaseline()


class AnalyzeRequest(BaseModel):
    userId: Optional[str] = None
    username: Optional[str] = None
    role: Optional[str] = "citizen"
    system: Optional[str] = ""
    action: Optional[str] = ""
    ipAddress: Optional[str] = "0.0.0.0"
    hour_of_day: Optional[int] = None
    day_of_week: Optional[int] = None
    is_working_hours: Optional[bool] = True
    is_known_device: Optional[bool] = True
    request_rate_ratio: Optional[float] = 1.0
    distance_from_usual_location: Optional[float] = 0.0
    failed_attempts_today: Optional[int] = 0
    unique_endpoints_accessed: Optional[int] = 1
    response_size_ratio: Optional[float] = 1.0
    outsideWorkingHours: Optional[bool] = False
    unknownDevice: Optional[bool] = False
    outsideAllowedLocation: Optional[bool] = False
    impossibleTravel: Optional[bool] = False
    failedAttempts: Optional[int] = 0
    requestRateRatio: Optional[float] = 1.0


class AnalyzeResponse(BaseModel):
    risk_score: int
    anomaly_detected: bool
    anomaly_type: str
    confidence: float
    explanation: str
    source: str = "ai_engine"


@router.post("/analyze", response_model=AnalyzeResponse)
async def analyze_event(req: AnalyzeRequest):
    try:
        event = req.model_dump()
        # Map alternative field names
        if req.outsideWorkingHours:
            event["is_working_hours"] = False
        if req.unknownDevice:
            event["is_known_device"] = False
        if req.failedAttempts:
            event["failed_attempts_today"] = req.failedAttempts
        if req.requestRateRatio:
            event["request_rate_ratio"] = req.requestRateRatio

        # Run detection
        result = detector.predict(event)
        risk_info = calculate_risk(
            result.get("raw_score", 0),
            __import__("numpy").array(result.get("features", [0] * 12))
        )

        # Update baseline if user identified
        user_id = req.userId or req.username or "anonymous"
        features = result.get("features", [])
        if features:
            baseline.update_baseline(user_id, features)
        deviation = baseline.get_deviation(user_id, features) if features else 0.0

        # Merge scores: combine IF model score with baseline deviation
        combined_score = min(100, risk_info["risk_score"] + int(deviation * 20))
        anomaly_detected = combined_score > 50 or result.get("anomaly_detected", False)

        # Classify anomaly type
        anomaly_type = "NONE"
        if anomaly_detected:
            if req.failedAttempts and req.failedAttempts > 3:
                anomaly_type = "BRUTE_FORCE"
            elif req.impossibleTravel:
                anomaly_type = "IMPOSSIBLE_TRAVEL"
            elif req.requestRateRatio and req.requestRateRatio > 5:
                anomaly_type = "API_ABUSE"
            elif not event.get("is_known_device", True):
                anomaly_type = "UNKNOWN_DEVICE"
            elif not event.get("is_working_hours", True):
                anomaly_type = "OFF_HOURS"
            else:
                anomaly_type = "BEHAVIORAL_ANOMALY"

        confidence = min(0.99, 0.5 + combined_score / 200)

        return AnalyzeResponse(
            risk_score=combined_score,
            anomaly_detected=anomaly_detected,
            anomaly_type=anomaly_type,
            confidence=round(confidence, 3),
            explanation=risk_info.get("explanation", "No anomaly indicators"),
            source="ai_engine" if detector.is_trained else "rule_engine_fallback",
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
