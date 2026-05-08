from typing import List, Dict, Any

DETECTION_WEIGHTS = {
    "car": 1.0,
    "truck": 1.2,
    "bus": 1.2,
    "motorcycle": 0.9,
    "bicycle": 0.7,
    "person": 0.5,
    "stop sign": 0.8,
    "fire hydrant": 0.6,
    "bench": 0.3,
    "unknown": 0.3
}

def calculate_risk_score(detections: List[Dict[str, Any]], speed_mps: float) -> Dict[str, Any]:
    """
    Calculates risk score based on detections and GPS speed.
    """
    base_score = 0.0
    
    for obj in detections:
        label = obj.get("label", "unknown").lower()
        confidence = obj.get("confidence", 0.0)
        direction = obj.get("direction", "stationary").lower()
        
        weight = DETECTION_WEIGHTS.get(label, DETECTION_WEIGHTS["unknown"])
        
        direction_factor = 1.0
        if direction == "approaching":
            direction_factor = 1.5
        elif direction == "moving_away":
            direction_factor = 0.5
            
        base_score += weight * confidence * direction_factor

    # Speed multiplier
    if speed_mps <= 1.0:
        speed_multiplier = 1.0
    elif speed_mps <= 3.0:
        speed_multiplier = 1.2
    else:
        speed_multiplier = 1.5
        
    final_score = min(base_score * speed_multiplier, 10.0)
    
    alert_level = "safe"
    if final_score >= 6.0:
        alert_level = "danger"
    elif final_score >= 3.0:
        alert_level = "caution"
        
    dominant_hazard = "None"
    if detections:
        # Simple logic: object with highest weight * confidence is dominant
        dominant_hazard = max(detections, key=lambda x: DETECTION_WEIGHTS.get(x.get("label", "unknown").lower(), 0.3) * x.get("confidence", 0.0)).get("label", "Unknown")

    return {
        "risk_score": round(final_score, 2),
        "alert_level": alert_level,
        "dominant_hazard": dominant_hazard
    }
