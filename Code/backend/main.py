from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from app.api.routes import users, sessions, hazards, sos
from app.api import websocket as ws_router
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="SureStep API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routes
app.include_router(users.router, prefix="/api")
app.include_router(sessions.router, prefix="/api")
app.include_router(hazards.router, prefix="/api")
app.include_router(sos.router, prefix="/api")
app.include_router(ws_router.router)

@app.get("/api/health")
def health_check():
    return {"status": "ok", "db": "disabled"}

@app.on_event("startup")
def startup_event():
    logger.info("SureStep Backend starting up (Stateless Mode)...")

from fastapi.exceptions import RequestValidationError

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request, exc):
    logger.error(f"Validation error: {exc.errors()}")
    return JSONResponse(
        status_code=422,
        content={"detail": exc.errors()},
    )

@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    logger.error(f"Global exception: {str(exc)}")
    return JSONResponse(
        status_code=500,
        content={"error": str(exc)},
    )
