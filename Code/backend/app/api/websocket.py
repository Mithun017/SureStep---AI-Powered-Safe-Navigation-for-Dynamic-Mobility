import json
import base64
import math
import logging
import cv2
import numpy as np
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from datetime import datetime
from ultralytics import YOLO
from app.core.config import settings
from app.core.risk_engine import calculate_risk_score
from typing import Dict, List, Set
import httpx


router = APIRouter()

# Simple geocoding cache to avoid over-calling APIs
geocode_cache = {}

async def get_place_name(lat, lon):
    key = f"{round(lat, 3)},{round(lon, 3)}"
    if key in geocode_cache:
        return geocode_cache[key]
    
    try:
        async with httpx.AsyncClient() as client:
            # Using Nominatim (OSM) - free but needs User-Agent
            url = f"https://nominatim.openstreetmap.org/reverse?format=json&lat={lat}&lon={lon}"
            headers = {"User-Agent": "SureStepNav/1.0"}
            resp = await client.get(url, headers=headers, timeout=2.0)
            if resp.status_code == 200:
                data = resp.json()
                address = data.get("address", {})
                place = address.get("road") or address.get("suburb") or address.get("city") or "Unknown Area"
                geocode_cache[key] = place
                return place
    except:
        pass
    return "Unknown Area"


logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Load YOLOv8 model
try:
    model = YOLO('yolov8n.pt')
    logger.info("YOLOv8 model loaded successfully.")
except Exception as e:
    logger.error(f"Failed to load YOLOv8: {e}")
    model = None

# Global state for active users
# userId -> { "name": str, "speed": float, "last_frame": str, "websocket": WebSocket, "subscribers": Set[WebSocket], "location": str }
active_connections: Dict[str, Dict] = {}

async def broadcast_user_list():
    user_list = [
        {"id": uid, "name": udata["name"], "speed": udata["speed"], "location": udata.get("location", "Unknown")}
        for uid, udata in active_connections.items()
    ]

    payload = json.dumps({"type": "user_list", "users": user_list})
    for udata in active_connections.values():
        try:
            await udata["websocket"].send_text(payload)
        except:
            pass

def get_yolo_detections(frame_b64: str):
    if not frame_b64 or model is None:
        return []
    try:
        img_bytes = base64.b64decode(frame_b64)
        nparr = np.frombuffer(img_bytes, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        if img is None: return []
        results = model.predict(img, conf=0.25, verbose=False)
        detections = []
        for r in results:
            for box in r.boxes:
                b = box.xyxyn[0].tolist() 
                bounding_box = [b[1], b[0], b[3], b[2]]
                height = b[3] - b[1]
                detections.append({
                    "label": r.names[int(box.cls[0])],
                    "confidence": float(box.conf[0]),
                    "direction": "approaching" if height > 0.4 else "stationary",
                    "distance_estimate": f"{round(max(1, 2.0/(height+0.01)), 1)}m",
                    "bounding_box": bounding_box
                })
        return detections
    except Exception as e:
        logger.error(f"Error in YOLO: {str(e)}")
        return []

@router.websocket("/ws/{session_id}")
async def websocket_endpoint(websocket: WebSocket, session_id: str):
    await websocket.accept()
    user_id = None
    subscribed_to = None
    
    try:
        while True:
            data = await websocket.receive_text()
            message = json.loads(data)
            
            # Handle Join
            if message.get("type") == "join":
                user_id = message.get("user_id")
                user_name = message.get("name", "Anonymous")
                active_connections[user_id] = {
                    "name": user_name,
                    "speed": 0.0,
                    "last_frame": None,
                    "websocket": websocket,
                    "subscribers": set(),
                    "location": "Joining..."
                }

                logger.info(f"User {user_name} ({user_id}) joined.")
                await broadcast_user_list()

            elif message.get("type") == "frame":
                curr_user_id = message.get("user_id")
                gps = message.get("gps", {})
                accel = message.get("accelerometer", {})
                frame_b64 = message.get("frame_b64")
                
                # Update local state
                if curr_user_id in active_connections:
                    active_connections[curr_user_id]["speed"] = gps.get("speed_mps", 0) * 3.6
                    active_connections[curr_user_id]["last_frame"] = frame_b64
                    
                    # Update location string
                    lat = gps.get("lat", 0)
                    lon = gps.get("lon", 0)
                    if lat != 0:
                        place = await get_place_name(lat, lon)
                        active_connections[curr_user_id]["location"] = f"{place} ({round(lat,4)}, {round(lon,4)})"


                    # Push frame to subscribers
                    if frame_b64:
                        remote_payload = json.dumps({
                            "type": "remote_frame",
                            "user_id": curr_user_id,
                            "frame": frame_b64
                        })
                        for sub_ws in list(active_connections[curr_user_id]["subscribers"]):
                            try:
                                await sub_ws.send_text(remote_payload)
                            except:
                                active_connections[curr_user_id]["subscribers"].remove(sub_ws)

                    # Periodically broadcast list to update speeds/locations
                    # (In a real app, throttle this, but for now every frame is okay)
                    await broadcast_user_list()

                # 1. Fall detection
                mag = math.sqrt(accel.get("x", 0)**2 + accel.get("y", 0)**2 + accel.get("z", 0)**2)
                if mag > 25.0:
                    await websocket.send_json({"type": "fall_alert", "magnitude": mag})

                # 2. YOLOv8 Inference
                detections = get_yolo_detections(frame_b64)
                risk_data = calculate_risk_score(detections, gps.get("speed_mps", 0))
                
                # 3. Send back local result
                await websocket.send_json({
                    "type": "alert",
                    "risk_score": risk_data["risk_score"],
                    "alert_level": risk_data["alert_level"],
                    "dominant_hazard": risk_data["dominant_hazard"],
                    "detections": detections,
                    "timestamp": datetime.now().isoformat()
                })

            elif message.get("type") == "chat":
                chat_payload = json.dumps({
                    "type": "chat",
                    "from_id": user_id,
                    "from_name": active_connections[user_id]["name"] if user_id in active_connections else "Unknown",
                    "text": message.get("text", ""),
                    "timestamp": datetime.now().isoformat()
                })
                # Broadcast chat to everyone
                for udata in active_connections.values():
                    try:
                        await udata["websocket"].send_text(chat_payload)
                    except:
                        pass

            elif message.get("type") == "subscribe":

                target_id = message.get("target_id")
                
                # Clean up previous subscription
                if subscribed_to and subscribed_to in active_connections:
                    active_connections[subscribed_to]["subscribers"].discard(websocket)
                
                if target_id in active_connections:
                    active_connections[target_id]["subscribers"].add(websocket)
                    subscribed_to = target_id
                    
                    # Send last frame immediately
                    if active_connections[target_id]["last_frame"]:
                        await websocket.send_json({
                            "type": "remote_frame",
                            "user_id": target_id,
                            "frame": active_connections[target_id]["last_frame"]
                        })

    except WebSocketDisconnect:
        pass
    except Exception as e:
        logger.error(f"WS error: {e}")
    finally:
        if user_id in active_connections:
            del active_connections[user_id]
        if subscribed_to and subscribed_to in active_connections:
            active_connections[subscribed_to]["subscribers"].discard(websocket)
        await broadcast_user_list()


