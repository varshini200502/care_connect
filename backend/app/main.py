import os
import json
import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Query, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.database import Base, engine, SessionLocal
from app.core.security import decode_token
from app.models.models import User, Conversation
from app.services.websocket_manager import ws_manager

# Import all routers
from app.routers import (
    auth, children, doctors, appointments, chat,
    prescriptions, medical_records, notifications, admin
)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("careconnect")

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Ensure database schema is created
    logger.info("Initializing CareConnect Database schema...")
    Base.metadata.create_all(bind=engine)
    try:
        from seed import seed_database
        seed_database()
        logger.info("CareConnect seed data verified.")
    except Exception as e:
        logger.warning(f"Auto-seed check: {e}")
    logger.info("CareConnect backend ready.")
    yield

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.PROJECT_VERSION,
    description="CareConnect - Pediatrician Online Consultation & Telemedicine Platform API",
    lifespan=lifespan
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Static file serving for uploads (prescriptions, records, chat media)
os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=settings.UPLOAD_DIR), name="uploads")

# Include API Routers
api_v1 = settings.API_V1_STR
app.include_router(auth.router, prefix=api_v1)
app.include_router(children.router, prefix=api_v1)
app.include_router(doctors.router, prefix=api_v1)
app.include_router(appointments.router, prefix=api_v1)
app.include_router(chat.router, prefix=api_v1)
app.include_router(prescriptions.router, prefix=api_v1)
app.include_router(medical_records.router, prefix=api_v1)
app.include_router(notifications.router, prefix=api_v1)
app.include_router(admin.router, prefix=api_v1)

# Root Health & Info endpoint
@app.get("/")
def root():
    return {
        "platform": settings.PROJECT_NAME,
        "version": settings.PROJECT_VERSION,
        "status": "online",
        "docs_url": "/docs",
        "timestamp": "2026-11-05"
    }

# ----------------- WebSocket Real-Time Chat Endpoint -----------------
@app.websocket("/ws/chat/{conversation_id}")
async def websocket_chat_endpoint(
    websocket: WebSocket,
    conversation_id: int,
    token: str = Query(...)
):
    # Verify Token
    try:
        payload = decode_token(token)
        user_id = int(payload.get("sub"))
    except Exception as e:
        logger.warning(f"WebSocket auth failed: {e}")
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return

    db = SessionLocal()
    try:
        conv = db.query(Conversation).filter(Conversation.id == conversation_id).first()
        user = db.query(User).filter(User.id == user_id).first()
        if not conv or not user:
            await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
            return

        # Participant authorization
        is_participant = (
            user.role == "ADMIN" or
            conv.parent_id == user.id or
            (user.doctor_profile and conv.doctor_id == user.doctor_profile.id)
        )
        if not is_participant:
            await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
            return
    finally:
        db.close()

    await ws_manager.connect_chat(conversation_id, websocket)
    try:
        while True:
            raw_data = await websocket.receive_text()
            data = json.loads(raw_data)
            event_type = data.get("type")

            # Handle typing indicator
            if event_type == "TYPING":
                await ws_manager.broadcast_chat(conversation_id, {
                    "type": "USER_TYPING",
                    "user_id": user_id,
                    "user_name": user.full_name,
                    "is_typing": bool(data.get("is_typing", True))
                })
    except WebSocketDisconnect:
        ws_manager.disconnect_chat(conversation_id, websocket)
    except Exception as e:
        logger.error(f"Chat WS error: {e}")
        ws_manager.disconnect_chat(conversation_id, websocket)

# ----------------- WebSocket User Notifications Stream -----------------
@app.websocket("/ws/notifications")
async def websocket_notifications_endpoint(
    websocket: WebSocket,
    token: str = Query(...)
):
    try:
        payload = decode_token(token)
        user_id = int(payload.get("sub"))
    except Exception as e:
        logger.warning(f"Notification WS auth failed: {e}")
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return

    await ws_manager.connect_notifications(user_id, websocket)
    try:
        while True:
            # Keep-alive heartbeat listener
            await websocket.receive_text()
    except WebSocketDisconnect:
        ws_manager.disconnect_notifications(user_id, websocket)
    except Exception as e:
        logger.error(f"Notification WS error: {e}")
        ws_manager.disconnect_notifications(user_id, websocket)
