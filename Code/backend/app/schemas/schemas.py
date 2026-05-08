from pydantic import BaseModel, EmailStr, ConfigDict, Field
from uuid import UUID
from datetime import datetime
from typing import List, Optional, Any

class UserCreate(BaseModel):
    name: str
    phone: str
    email: str

class UserOut(BaseModel):
    id: UUID
    name: str
    phone: str
    email: str
    created_at: datetime
    is_active: bool
    model_config = ConfigDict(from_attributes=True)

class TrustedContactCreate(BaseModel):
    contact_name: str
    contact_phone: str
    contact_email: str

class TrustedContactOut(BaseModel):
    id: UUID
    user_id: UUID
    contact_name: str
    contact_phone: str
    contact_email: str
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)

class SessionCreate(BaseModel):
    user_id: UUID
    start_lat: float
    start_lon: float
    end_lat: float
    end_lon: float

class SessionOut(BaseModel):
    id: UUID
    user_id: UUID
    start_lat: float
    start_lon: float
    end_lat: float
    end_lon: float
    started_at: datetime
    ended_at: Optional[datetime] = None
    status: str
    model_config = ConfigDict(from_attributes=True)

class HazardEventOut(BaseModel):
    id: UUID
    session_id: UUID
    user_id: UUID
    detected_objects: List[dict]
    risk_score: float
    lat: float
    lon: float
    alert_type: str
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)

class SOSEventCreate(BaseModel):
    user_id: UUID
    session_id: Optional[UUID] = None
    lat: float
    lon: float

class SOSEventOut(BaseModel):
    id: UUID
    user_id: UUID
    session_id: Optional[UUID]
    lat: float
    lon: float
    triggered_at: datetime
    resolved_at: Optional[datetime]
    status: str
    model_config = ConfigDict(from_attributes=True)

class FallEventCreate(BaseModel):
    user_id: UUID
    session_id: Optional[UUID] = None
    accel_x: float
    accel_y: float
    accel_z: float
    magnitude: float
    lat: Optional[float] = None
    lon: Optional[float] = None

class FallEventOut(BaseModel):
    id: UUID
    user_id: UUID
    session_id: Optional[UUID]
    accel_x: float
    accel_y: float
    accel_z: float
    magnitude: float
    lat: Optional[float]
    lon: Optional[float]
    detected_at: datetime
    model_config = ConfigDict(from_attributes=True)
