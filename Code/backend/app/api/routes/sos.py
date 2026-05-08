from fastapi import APIRouter, HTTPException
from typing import List, Dict
from uuid import UUID, uuid4
from datetime import datetime
from app.schemas import schemas

router = APIRouter(tags=["sos", "fall"])

# In-memory storage
sos_db: Dict[UUID, dict] = {}
fall_db: List[dict] = []

@router.post("/sos", response_model=schemas.SOSEventOut)
def trigger_sos(sos: schemas.SOSEventCreate):
    sos_id = uuid4()
    db_sos = {
        "id": sos_id,
        "user_id": sos.user_id,
        "session_id": sos.session_id,
        "lat": sos.lat,
        "lon": sos.lon,
        "triggered_at": datetime.now(),
        "resolved_at": None,
        "status": "active"
    }
    sos_db[sos_id] = db_sos
    return db_sos

@router.get("/sos/{sos_id}", response_model=schemas.SOSEventOut)
def get_sos(sos_id: UUID):
    sos = sos_db.get(sos_id)
    if not sos:
        raise HTTPException(status_code=404, detail="SOS event not found")
    return sos

@router.patch("/sos/{sos_id}/resolve", response_model=schemas.SOSEventOut)
def resolve_sos(sos_id: UUID):
    sos = sos_db.get(sos_id)
    if not sos:
        raise HTTPException(status_code=404, detail="SOS event not found")
    sos["resolved_at"] = datetime.now()
    sos["status"] = "resolved"
    return sos

@router.post("/fall", response_model=schemas.FallEventOut)
def log_fall(fall: schemas.FallEventCreate):
    fall_id = uuid4()
    db_fall = {
        "id": fall_id,
        "user_id": fall.user_id,
        "session_id": fall.session_id,
        "accel_x": fall.accel_x,
        "accel_y": fall.accel_y,
        "accel_z": fall.accel_z,
        "magnitude": fall.magnitude,
        "lat": fall.lat,
        "lon": fall.lon,
        "detected_at": datetime.now()
    }
    fall_db.append(db_fall)
    return db_fall

