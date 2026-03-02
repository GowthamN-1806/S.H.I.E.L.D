from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from models.isolation_forest import detector
import numpy as np
import math

router = APIRouter()


class TrainRequest(BaseModel):
    events: list[dict] = []


class TrainResponse(BaseModel):
    status: str
    message: str
    samples_trained: int = 0


@router.post("/train", response_model=TrainResponse)
async def train_model(req: TrainRequest):
    try:
        events = req.events
        # If no events provided, generate synthetic normal data for demo
        if len(events) < 10:
            events = _generate_synthetic_normal_events(200)

        result = detector.train(events)
        if result["status"] == "error":
            raise HTTPException(status_code=400, detail=result["message"])

        return TrainResponse(
            status="success",
            message=f"Model trained on {result['samples_trained']} events with {result['features']} features",
            samples_trained=result["samples_trained"],
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


def _generate_synthetic_normal_events(n: int) -> list[dict]:
    """Generate synthetic normal access events for initial model training."""
    events = []
    roles = ["super_admin", "city_admin", "traffic_officer", "water_operator",
             "power_controller", "emergency_services", "maintenance", "citizen",
             "api_partner", "security_analyst"]

    for _ in range(n):
        hour = np.random.choice(range(8, 18))  # working hours
        day = np.random.choice(range(0, 5))  # weekdays
        events.append({
            "hour_of_day": int(hour),
            "day_of_week": int(day),
            "is_working_hours": True,
            "request_rate_ratio": float(np.clip(np.random.normal(1.0, 0.3), 0.1, 3.0)),
            "is_known_device": True,
            "distance_from_usual_location": float(np.clip(np.random.exponential(5), 0, 50)),
            "failed_attempts_today": int(np.random.choice([0, 0, 0, 0, 1])),
            "unique_endpoints_accessed": int(np.random.choice(range(1, 6))),
            "response_size_ratio": float(np.clip(np.random.normal(1.0, 0.2), 0.3, 2.0)),
            "role": np.random.choice(roles),
        })
    return events
