FULL PROMPT — COPY BELOW THIS LINE:

You are a senior full-stack engineer. Build SureStep — a complete, production-ready AI-powered pedestrian safety navigation system — from scratch. Follow every instruction precisely. If any step fails or throws an error, debug and fix it automatically before continuing. Never stop mid-way; always self-recover.

PROJECT OVERVIEW
SureStep is a real-time safety navigation app that fuses AI vision inference, GPS, device sensors, and a risk-scoring engine to detect hazards (vehicles, construction, obstacles) in the user's immediate path and deliver alerts via voice, visual overlay, and haptic feedback. It covers the "last-meter" safety gap that standard GPS ignores.

ENVIRONMENT & CREDENTIALS
NIM_API_KEY=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
NIM_BASE_URL=https://integrate.api.nvidia.com/v1
MODEL=google/gemma-2-9b-it
DATABASE_URL=postgresql://postgres:Mithun1701@localhost/SafeNav
HOST=0.0.0.0
PORT=8000
Place these in /Code/backend/.env. Never hardcode them in source files; always load via python-dotenv.

PART 1 — DATABASE SCHEMA (PostgreSQL)
Create the database SafeNav if it does not exist. Use SQLAlchemy with Alembic migrations. Define the following tables exactly:
users — id (UUID PK), name (VARCHAR 100), phone (VARCHAR 20 UNIQUE), email (VARCHAR 150 UNIQUE), created_at (TIMESTAMP DEFAULT NOW), is_active (BOOLEAN DEFAULT TRUE)
trusted_contacts — id (UUID PK), user_id (UUID FK → users.id ON DELETE CASCADE), contact_name (VARCHAR 100), contact_phone (VARCHAR 20), contact_email (VARCHAR 150), created_at (TIMESTAMP DEFAULT NOW)
navigation_sessions — id (UUID PK), user_id (UUID FK → users.id), start_lat (FLOAT), start_lon (FLOAT), end_lat (FLOAT), end_lon (FLOAT), started_at (TIMESTAMP DEFAULT NOW), ended_at (TIMESTAMP NULLABLE), status (VARCHAR 20 DEFAULT 'active') — values: active, completed, aborted
hazard_events — id (UUID PK), session_id (UUID FK → navigation_sessions.id), user_id (UUID FK → users.id), detected_objects (JSONB) — array of {label, confidence, bounding_box}, risk_score (FLOAT), lat (FLOAT), lon (FLOAT), alert_type (VARCHAR 30) — values: voice, visual, haptic, combined, raw_frame_ref (TEXT NULLABLE), created_at (TIMESTAMP DEFAULT NOW)
sos_events — id (UUID PK), user_id (UUID FK → users.id), session_id (UUID FK → navigation_sessions.id NULLABLE), lat (FLOAT), lon (FLOAT), triggered_at (TIMESTAMP DEFAULT NOW), resolved_at (TIMESTAMP NULLABLE), status (VARCHAR 20 DEFAULT 'active') — values: active, resolved
fall_events — id (UUID PK), user_id (UUID FK → users.id), session_id (UUID FK → navigation_sessions.id NULLABLE), accel_x (FLOAT), accel_y (FLOAT), accel_z (FLOAT), magnitude (FLOAT), lat (FLOAT NULLABLE), lon (FLOAT NULLABLE), detected_at (TIMESTAMP DEFAULT NOW)
Run alembic upgrade head to apply all migrations. If the DB doesn't exist, create it first using psycopg2 before running migrations.

PART 2 — BACKEND (FastAPI + Python)
Directory: /Code/backend/
File structure to create:
/Code/backend/
├── .env
├── requirements.txt
├── main.py
├── alembic.ini
├── alembic/versions/
├── app/
│   ├── __init__.py
│   ├── api/
│   │   ├── __init__.py
│   │   ├── routes/
│   │   │   ├── users.py
│   │   │   ├── sessions.py
│   │   │   ├── hazards.py
│   │   │   └── sos.py
│   │   └── websocket.py
│   ├── core/
│   │   ├── config.py
│   │   ├── database.py
│   │   └── risk_engine.py
│   ├── models/
│   │   └── models.py
│   └── schemas/
│       └── schemas.py
requirements.txt must include:
fastapi, uvicorn[standard], sqlalchemy, alembic, psycopg2-binary, python-dotenv, pydantic[email], websockets, httpx, python-multipart, pillow, base64 (stdlib), uuid (stdlib)
app/core/config.py
Load all values from .env using pydantic-settings BaseSettings. Expose: NIM_API_KEY, NIM_BASE_URL, MODEL, DATABASE_URL, HOST, PORT.
app/core/database.py
Create SQLAlchemy engine and SessionLocal using DATABASE_URL. Expose get_db dependency for FastAPI. Use Base = declarative_base().
app/models/models.py
Define all six SQLAlchemy ORM models matching the schema in Part 1 exactly. Use UUID(as_uuid=True) with default=uuid.uuid4. Use JSONB for detected_objects.
app/schemas/schemas.py
Define Pydantic v2 schemas for: UserCreate, UserOut, TrustedContactCreate, TrustedContactOut, SessionCreate, SessionOut, HazardEventOut, SOSEventCreate, SOSEventOut, FallEventCreate, FallEventOut. All Out schemas must have model_config = ConfigDict(from_attributes=True).
REST Routes
/api/users — POST create user, GET list users, GET /api/users/{user_id} single user, DELETE user
/api/users/{user_id}/contacts — POST add trusted contact, GET list contacts, DELETE /api/users/{user_id}/contacts/{contact_id}
/api/sessions — POST start session (body: user_id, start_lat, start_lon, end_lat, end_lon), GET /api/sessions/{session_id}, PATCH /api/sessions/{session_id}/end (sets ended_at and status=completed)
/api/hazards — POST log hazard manually, GET /api/hazards/session/{session_id} all hazards for a session
/api/sos — POST trigger SOS (body: user_id, session_id optional, lat, lon), GET /api/sos/{sos_id}, PATCH /api/sos/{sos_id}/resolve
/api/fall — POST log fall event (body: user_id, session_id optional, accel_x, accel_y, accel_z, magnitude, lat, lon)
/api/health — GET returns {"status": "ok", "db": "connected"} — ping the DB on every call
app/core/risk_engine.py — Risk Scoring Logic
The engine receives a list of detected objects (each with label, confidence, distance_estimate) plus vehicle speed context. It calculates:
risk_score = sum( detection_weight[label] * confidence * direction_factor ) * speed_multiplier
Detection weights by label — vehicle: 1.0, motorcycle: 0.9, bicycle: 0.7, person: 0.4, construction_zone: 0.8, obstacle: 0.6, unknown: 0.3
direction_factor — if the object is moving toward the user (from NIM inference context): 1.5, stationary: 1.0, moving away: 0.5
speed_multiplier — derived from GPS speed in m/s: 0–1 m/s → 1.0, 1–3 m/s → 1.2, >3 m/s → 1.5
Cap the final score at 10.0. Return: {"risk_score": float, "alert_level": "safe"|"caution"|"danger", "dominant_hazard": str} — safe if score < 3, caution if 3–6, danger if > 6.
app/api/websocket.py — Real-Time Loop
Implement a WebSocket endpoint at /ws/{session_id}. The client sends JSON messages in this exact format:
json{
  "type": "frame",
  "session_id": "uuid",
  "user_id": "uuid",
  "gps": {"lat": float, "lon": float, "speed_mps": float},
  "accelerometer": {"x": float, "y": float, "z": float},
  "frame_b64": "base64-encoded JPEG string"
}
On each received message:

Decode the base64 frame.
Send it to NVIDIA NIM (NIM_BASE_URL/chat/completions) with model google/gemma-2-9b-it. The prompt must instruct the model to return a JSON array of detected objects like: [{"label": "vehicle", "confidence": 0.92, "direction": "approaching", "distance_estimate": "5m"}]. Parse the response, stripping any markdown fencing.
Check accelerometer magnitude = sqrt(x²+y²+z²). If magnitude > 25 m/s², auto-log a fall event to DB and push a fall alert back to the client.
Pass NIM detections + GPS speed to the risk engine.
Persist the hazard event to hazard_events table.
Push this JSON back to the client immediately:

json{
  "type": "alert",
  "risk_score": float,
  "alert_level": "safe|caution|danger",
  "dominant_hazard": "string",
  "detections": [...],
  "actions": ["voice", "visual", "haptic"],
  "timestamp": "ISO8601"
}
If alert_level is "danger", include "sos_suggestion": true in the response.
Handle all NIM API errors gracefully — if NIM fails, return risk_score 0 and alert_level "safe" rather than crashing. Log the error server-side.
main.py
Mount all routers under /api. Include the WebSocket router. Add CORS middleware allowing all origins (for dev). On startup, confirm DB connection and log it. Include a global exception handler that returns {"error": str(exc)} with HTTP 500.

PART 3 — FRONTEND (React 19 + Vite)
Directory: /Code/frontend/
Use: React 19, Vite, Leaflet.js (for maps), Framer Motion (for animations), Lucide React (for icons), native Browser APIs (Speech Synthesis, Vibration, Geolocation, DeviceMotion, MediaDevices/camera). Vanilla CSS with glassmorphism design language. No Tailwind, no UI component library.
Design System — apply globally via CSS variables:
css--glass-bg: rgba(255,255,255,0.08);
--glass-border: rgba(255,255,255,0.15);
--glass-blur: blur(16px);
--color-safe: #00e676;
--color-caution: #ffea00;
--color-danger: #ff1744;
--color-primary: #00bcd4;
--color-surface: rgba(10,10,20,0.85);
--font-main: 'Inter', sans-serif;
Background of the app is always a deep dark gradient: linear-gradient(135deg, #0a0a14 0%, #0d1b2a 100%).
App Structure:
/Code/frontend/src/
├── main.jsx
├── App.jsx
├── api/
│   └── websocket.js
├── components/
│   ├── Map/MapView.jsx
│   ├── HUD/SafeWindow.jsx
│   ├── HUD/RiskMeter.jsx
│   ├── HUD/AlertBanner.jsx
│   ├── Controls/SOSButton.jsx
│   ├── Controls/VoiceToggle.jsx
│   └── Panels/ContactsPanel.jsx
├── hooks/
│   ├── useGPS.js
│   ├── useAccelerometer.js
│   ├── useCamera.js
│   └── useVoice.js
├── styles/
│   └── global.css
└── utils/
    └── frameCapture.js
api/websocket.js
Export a class SureStepWS that: connects to ws://localhost:8000/ws/{sessionId}, has methods send(payload) and close(), accepts onMessage(data) and onError(err) callbacks, and auto-reconnects up to 5 times with 2s delay on disconnect.
hooks/useGPS.js
Use navigator.geolocation.watchPosition with enableHighAccuracy: true. Return {lat, lon, speed, accuracy, error}. Derive speed_mps from the geolocation speed value (already in m/s in the Geolocation API).
hooks/useAccelerometer.js
Listen to window.addEventListener('devicemotion'). Extract accelerationIncludingGravity.x/y/z. Compute magnitude. Return {x, y, z, magnitude}.
hooks/useCamera.js
Use navigator.mediaDevices.getUserMedia({video: {facingMode: 'environment'}}). Return a videoRef that can be rendered in a <video> element. Expose captureFrame() which draws the current video frame to a hidden canvas and returns it as a base64 JPEG string at 480×360 resolution. Handle permission denied gracefully.
hooks/useVoice.js
Use window.speechSynthesis. Expose speak(text) which cancels any current speech and reads the given text aloud using a natural-sounding voice (prefer 'Google UK English Female' or fallback to first available). Also expose isEnabled toggle state and toggleVoice().
utils/frameCapture.js
Export captureFrameFromVideo(videoElement) — draws to a 480×360 offscreen canvas and returns base64 JPEG.
components/Map/MapView.jsx
Use Leaflet.js with OpenStreetMap tiles (https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png). On GPS update, smoothly fly to the new coordinates using map.flyTo([lat, lon], 17, {duration: 1.2}). Display a pulsing blue circle marker at the user's position. Display small red markers for each hazard event received in the current session. The map container must be 100% width and 40vh height. Render the map only once (use useRef + useEffect with empty deps for init). Update position and hazard markers on data changes without re-initializing the map.
components/HUD/SafeWindow.jsx
This is a glassmorphic overlay positioned absolutely over the camera feed. It renders bounding-box overlays for detected objects by mapping their bounding_box (normalized 0–1 coordinates from NIM) to screen pixel positions. Each box is a colored border div (green for safe objects, yellow for caution, red for danger). Use Framer Motion animate to fade boxes in/out. The overlay must be pointer-events none so the camera feed stays interactive.
components/HUD/RiskMeter.jsx
An animated circular gauge. The gauge sweeps from 0 to the current risk_score (0–10). Color transitions smoothly from --color-safe at 0–3, --color-caution at 3–6, --color-danger at 6–10. Use SVG with a strokeDashoffset animation driven by Framer Motion. Display the numeric score in the center. Display the alert_level label below the score.
components/HUD/AlertBanner.jsx
A slide-in banner from the top of the screen using Framer Motion AnimatePresence. It appears only when alert_level is "caution" or "danger". Shows the dominant hazard name, a warning icon (Lucide), and the alert level text. Danger banners pulse red. Caution banners pulse yellow. Auto-dismiss after 4 seconds unless a new alert arrives.
components/Controls/SOSButton.jsx
A large circular red button with a shield icon (Lucide). On press-and-hold for 2 seconds, it triggers the SOS API (POST /api/sos) with the user's current GPS coordinates, then shows a confirmation modal. The button has a radial progress ring around it that fills during the hold. Vibrate 3 times using navigator.vibrate([200, 100, 200]) on confirmation.
components/Controls/VoiceToggle.jsx
A toggle button with a microphone icon (Lucide). Toggles voice alerts on/off using the useVoice hook. Shows active state with a glowing cyan ring.
App.jsx — Main Orchestration Loop
This is the heart of the application. It must:

On mount, request all permissions: camera, geolocation, device motion.
Create a navigation session via POST /api/sessions using the start GPS position.
Initialize SureStepWS with the session ID.
Start an interval every 500ms that: captures a camera frame using captureFrame(), reads current GPS and accelerometer values, and sends the combined payload over the WebSocket.
On each WebSocket onMessage: parse the alert data, update all HUD components (RiskMeter, SafeWindow, AlertBanner), trigger voice alert using speak() if alert_level is not "safe" and voice is enabled, trigger navigator.vibrate(200) if "caution" or navigator.vibrate([500,200,500]) if "danger".
On unmount, close the WebSocket and end the session via PATCH /api/sessions/{id}/end.

Layout: full-screen, dark. Camera feed (<video>) takes the full background. SafeWindow overlay sits on top. Bottom dock contains RiskMeter + AlertBanner. Top-right corner has SOSButton. Top-left has VoiceToggle. MapView is a collapsible panel that slides in from the bottom.

PART 4 — AUTOMATION SCRIPTS
setup.bat (Windows)

Create and activate a Python virtual environment at /Code/backend/venv.
Install all requirements from requirements.txt.
Create the PostgreSQL database SafeNav if it doesn't exist.
Run alembic upgrade head.
Run npm install inside /Code/frontend.
Print "SureStep setup complete."

run.bat (Windows)

In one terminal, activate venv and run: uvicorn main:app --host 0.0.0.0 --port 8000 --reload from /Code/backend.
In another terminal, run: npm run dev from /Code/frontend.
Print "SureStep is running. Backend: http://localhost:8000 | Frontend: http://localhost:5173"


PART 5 — ERROR RECOVERY RULES (MANDATORY)
Apply these throughout the entire build process without exception:

If any pip install fails, retry with --no-cache-dir.
If alembic upgrade head fails due to missing DB, create the DB first then retry.
If the NIM API returns a non-JSON response or times out, log the raw response, return a safe default risk score (0), and continue — never crash the WebSocket loop.
If camera permission is denied in the frontend, show a "Camera unavailable" overlay but keep GPS and accelerometer active. Continue sending frames as null and skip NIM inference server-side when frame is null.
If geolocation is unavailable, default to lat=0, lon=0 and log a warning — never crash.
If the WebSocket connection drops, auto-reconnect using the SureStepWS class retry logic.
If any SQLAlchemy operation fails, rollback the session, log the error, and return HTTP 500 with {"error": "db_error"}.
Never use bare except: — always catch specific exceptions and log them.


DELIVERABLE
When all parts are complete, print a summary table:
Component          | Status | URL/Path
Backend API        | ✅     | http://localhost:8000
WebSocket          | ✅     | ws://localhost:8000/ws/{session_id}
Database           | ✅     | postgresql://localhost/SafeNav
Frontend           | ✅     | http://localhost:5173
Setup Script       | ✅     | ./setup.bat
Run Script         | ✅     | ./run.bat
Then print: "Run setup.bat once to install, then run.bat to start the full application."