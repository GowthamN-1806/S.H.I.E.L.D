import numpy as np
import math
from datetime import datetime

ROLE_SENSITIVITY = {
    "super_admin": 5, "city_admin": 4, "security_analyst": 4,
    "traffic_officer": 3, "water_operator": 3, "power_controller": 3,
    "emergency_services": 3, "maintenance": 2, "api_partner": 2, "citizen": 1,
}


def extract_features(event: dict) -> np.ndarray:
    """Extract numeric feature vector from an access event."""
    now = datetime.utcnow()
    hour = event.get("hour_of_day", now.hour)
    day = event.get("day_of_week", now.weekday())

    # Cyclically encode time features
    hour_sin = math.sin(2 * math.pi * hour / 24)
    hour_cos = math.cos(2 * math.pi * hour / 24)
    day_sin = math.sin(2 * math.pi * day / 7)
    day_cos = math.cos(2 * math.pi * day / 7)

    is_working = 1 if event.get("is_working_hours", True) else 0
    rate_ratio = float(event.get("request_rate_ratio", 1.0))
    known_device = 1 if event.get("is_known_device", True) else 0
    distance = float(event.get("distance_from_usual_location", 0))
    failed = int(event.get("failed_attempts_today", 0))
    unique_endpoints = int(event.get("unique_endpoints_accessed", 1))
    response_ratio = float(event.get("response_size_ratio", 1.0))
    role = event.get("role", "citizen")
    sensitivity = ROLE_SENSITIVITY.get(role, 1)

    features = np.array([
        hour_sin, hour_cos, day_sin, day_cos,
        is_working, rate_ratio, known_device,
        distance, failed, unique_endpoints,
        response_ratio, sensitivity,
    ], dtype=np.float64)

    return features


FEATURE_NAMES = [
    "hour_sin", "hour_cos", "day_sin", "day_cos",
    "is_working_hours", "request_rate_ratio", "is_known_device",
    "distance_from_location", "failed_attempts", "unique_endpoints",
    "response_size_ratio", "role_sensitivity",
]
