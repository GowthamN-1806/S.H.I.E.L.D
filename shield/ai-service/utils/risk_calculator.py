import numpy as np
from utils.feature_extractor import FEATURE_NAMES


def calculate_risk(anomaly_score: float, features: np.ndarray) -> dict:
    """
    Convert Isolation Forest anomaly score to a 0-100 risk score
    and generate human-readable explanation.
    """
    # anomaly_score from decision_function: negative = anomalous, positive = normal
    # Normalize to 0-100 (more negative = higher risk)
    risk_score = int(np.clip(50 - anomaly_score * 200, 0, 100))

    # Determine top contributing features
    feature_abs = np.abs(features)
    top_indices = np.argsort(feature_abs)[::-1][:5]

    factors = []
    for idx in top_indices:
        name = FEATURE_NAMES[idx] if idx < len(FEATURE_NAMES) else f"feature_{idx}"
        val = features[idx]
        if name == "is_working_hours" and val == 0:
            factors.append("Access outside working hours")
        elif name == "is_known_device" and val == 0:
            factors.append("Unknown/unregistered device")
        elif name == "request_rate_ratio" and val > 3:
            factors.append(f"API request rate {val:.1f}x above average")
        elif name == "distance_from_location" and val > 100:
            factors.append(f"Unusual location ({val:.0f}km from baseline)")
        elif name == "failed_attempts" and val > 0:
            factors.append(f"{int(val)} failed login attempts today")
        elif name == "unique_endpoints" and val > 5:
            factors.append(f"Accessed {int(val)} unique endpoints (rapid scan)")
        elif name == "response_size_ratio" and val > 5:
            factors.append(f"Response size {val:.1f}x above average (data exfil risk)")
        elif name == "role_sensitivity" and val >= 4:
            factors.append("High-privilege account access")

    if not factors:
        factors.append("No significant anomaly indicators")

    # Determine level
    if risk_score <= 25:
        level = "LOW"
        recommendation = "ALLOW"
    elif risk_score <= 50:
        level = "MEDIUM"
        recommendation = "WARN"
    elif risk_score <= 75:
        level = "HIGH"
        recommendation = "MFA_CHALLENGE"
    elif risk_score <= 90:
        level = "VERY_HIGH"
        recommendation = "SUSPEND"
    else:
        level = "CRITICAL"
        recommendation = "LOCKOUT"

    return {
        "risk_score": risk_score,
        "level": level,
        "recommendation": recommendation,
        "factors": factors,
        "explanation": "; ".join(factors),
    }
