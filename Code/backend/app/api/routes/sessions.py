from fastapi import APIRouter, HTTPException
from typing import Dict
from uuid import UUID, uuid4
from datetime import datetime
from app.schemas import schemas

router = APIRouter(prefix="/sessions", tags=["sessions"])

# In-memory storage
sessions_db: Dict[UUID, dict] = {}

@router.post("", response_model=schemas.SessionOut)
def start_session(session_data: schemas.SessionCreate):
    session_id = uuid4()
    db_session = {
        "id": session_id,
        "user_id": session_data.user_id,
        "start_lat": session_data.start_lat,
        "start_lon": session_data.start_lon,
        "end_lat": session_data.end_lat,
        "end_lon": session_data.end_lon,
        "started_at": datetime.now(),
        "ended_at": None,
        "status": "active"
    }
    sessions_db[session_id] = db_session
    return db_session

@router.get("/{session_id}", response_model=schemas.SessionOut)
def get_session(session_id: UUID):
    session = sessions_db.get(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    return session

@router.patch("/{session_id}/end", response_model=schemas.SessionOut)
def end_session(session_id: UUID):
    session = sessions_db.get(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    session["ended_at"] = datetime.now()
    session["status"] = "completed"
    return session

