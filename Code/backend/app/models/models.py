from sqlalchemy import Column, String, Float, DateTime, Boolean, ForeignKey, JSON
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.sql import func
import uuid
from app.core.database import Base

class User(Base):
    __tablename__ = "users"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(100), nullable=False)
    phone = Column(String(20), unique=True, nullable=False)
    email = Column(String(150), unique=True, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    is_active = Column(Boolean, default=True)

class TrustedContact(Base):
    __tablename__ = "trusted_contacts"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"))
    contact_name = Column(String(100), nullable=False)
    contact_phone = Column(String(20), nullable=False)
    contact_email = Column(String(150), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class NavigationSession(Base):
    __tablename__ = "navigation_sessions"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    start_lat = Column(Float, nullable=False)
    start_lon = Column(Float, nullable=False)
    end_lat = Column(Float, nullable=False)
    end_lon = Column(Float, nullable=False)
    started_at = Column(DateTime(timezone=True), server_default=func.now())
    ended_at = Column(DateTime(timezone=True), nullable=True)
    status = Column(String(20), default="active") # active, completed, aborted

class HazardEvent(Base):
    __tablename__ = "hazard_events"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    session_id = Column(UUID(as_uuid=True), ForeignKey("navigation_sessions.id"))
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    detected_objects = Column(JSONB, nullable=False) # array of {label, confidence, bounding_box}
    risk_score = Column(Float, nullable=False)
    lat = Column(Float, nullable=False)
    lon = Column(Float, nullable=False)
    alert_type = Column(String(30), nullable=False) # voice, visual, haptic, combined
    raw_frame_ref = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class SOSEvent(Base):
    __tablename__ = "sos_events"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    session_id = Column(UUID(as_uuid=True), ForeignKey("navigation_sessions.id"), nullable=True)
    lat = Column(Float, nullable=False)
    lon = Column(Float, nullable=False)
    triggered_at = Column(DateTime(timezone=True), server_default=func.now())
    resolved_at = Column(DateTime(timezone=True), nullable=True)
    status = Column(String(20), default="active") # active, resolved

class FallEvent(Base):
    __tablename__ = "fall_events"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    session_id = Column(UUID(as_uuid=True), ForeignKey("navigation_sessions.id"), nullable=True)
    accel_x = Column(Float, nullable=False)
    accel_y = Column(Float, nullable=False)
    accel_z = Column(Float, nullable=False)
    magnitude = Column(Float, nullable=False)
    lat = Column(Float, nullable=True)
    lon = Column(Float, nullable=True)
    detected_at = Column(DateTime(timezone=True), server_default=func.now())
