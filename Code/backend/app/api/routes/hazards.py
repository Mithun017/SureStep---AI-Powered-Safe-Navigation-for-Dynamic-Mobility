from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from uuid import UUID
from app.core.database import get_db
from app.models import models
from app.schemas import schemas

router = APIRouter(prefix="/hazards", tags=["hazards"])

@router.get("/session/{session_id}", response_model=List[schemas.HazardEventOut])
def get_session_hazards(session_id: UUID, db: Session = Depends(get_db)):
    return db.query(models.HazardEvent).filter(models.HazardEvent.session_id == session_id).all()
