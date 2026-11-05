import os
import uuid
import shutil
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import get_current_user
from app.models.models import Conversation, Message, User, UserRole, MessageType, NotificationType, Doctor
from app.schemas.schemas import ConversationOut, MessageOut, MessageCreate
from app.services.websocket_manager import ws_manager
from app.services.notification_service import create_notification
from app.core.config import settings

router = APIRouter(prefix="/chat", tags=["Real-time Chat"])

def get_conversation_authorized(conversation_id: int, current_user: User, db: Session) -> Conversation:
    conv = db.query(Conversation).filter(Conversation.id == conversation_id).first()
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found.")

    is_parent = conv.parent_id == current_user.id
    is_doctor = current_user.doctor_profile and conv.doctor_id == current_user.doctor_profile.id
    is_admin = current_user.role == UserRole.ADMIN.value

    if not (is_parent or is_doctor or is_admin):
        raise HTTPException(status_code=403, detail="You do not have permission to access this chat conversation.")
    return conv

@router.get("/conversations", response_model=List[ConversationOut])
def get_user_conversations(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    query = db.query(Conversation)
    if current_user.role == UserRole.PARENT.value:
        query = query.filter(Conversation.parent_id == current_user.id)
    elif current_user.role == UserRole.DOCTOR.value and current_user.doctor_profile:
        query = query.filter(Conversation.doctor_id == current_user.doctor_profile.id)

    conversations = query.order_by(Conversation.updated_at.desc()).all()
    results = []

    for conv in conversations:
        last_msg = db.query(Message).filter(Message.conversation_id == conv.id).order_by(Message.created_at.desc()).first()
        unread_count = db.query(Message).filter(
            Message.conversation_id == conv.id,
            Message.sender_id != current_user.id,
            Message.is_read == False
        ).count()

        doctor_obj = db.query(Doctor).filter(Doctor.id == conv.doctor_id).first()
        doc_name = f"Dr. {doctor_obj.user.full_name}" if (doctor_obj and doctor_obj.user) else "Doctor"
        parent_user = db.query(User).filter(User.id == conv.parent_id).first()
        parent_name = parent_user.full_name if parent_user else "Parent"

        results.append(ConversationOut(
            id=conv.id,
            appointment_id=conv.appointment_id,
            parent_id=conv.parent_id,
            doctor_id=conv.doctor_id,
            child_id=conv.child_id,
            created_at=conv.created_at,
            updated_at=conv.updated_at,
            child_name=conv.appointment.child.full_name if conv.appointment and conv.appointment.child else "Child",
            doctor_name=doc_name,
            parent_name=parent_name,
            last_message=last_message_out(last_msg) if last_msg else None,
            unread_count=unread_count
        ))

    return results

def last_message_out(msg: Message) -> MessageOut:
    return MessageOut(
        id=msg.id,
        conversation_id=msg.conversation_id,
        sender_id=msg.sender_id,
        sender_role=msg.sender_role,
        message_text=msg.message_text,
        message_type=msg.message_type,
        attachment_url=msg.attachment_url,
        attachment_name=msg.attachment_name,
        is_read=msg.is_read,
        created_at=msg.created_at
    )

@router.get("/conversations/{conversation_id}/messages", response_model=List[MessageOut])
def get_conversation_messages(
    conversation_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    conv = get_conversation_authorized(conversation_id, current_user, db)
    messages = db.query(Message).filter(Message.conversation_id == conv.id).order_by(Message.created_at.asc()).all()

    # Mark unread messages sent by the other party as read
    db.query(Message).filter(
        Message.conversation_id == conv.id,
        Message.sender_id != current_user.id,
        Message.is_read == False
    ).update({"is_read": True})
    db.commit()

    return messages

@router.post("/conversations/{conversation_id}/messages", response_model=MessageOut)
async def send_chat_message(
    conversation_id: int,
    payload: MessageCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    conv = get_conversation_authorized(conversation_id, current_user, db)

    msg = Message(
        conversation_id=conv.id,
        sender_id=current_user.id,
        sender_role=current_user.role,
        message_text=payload.message_text.strip(),
        message_type=payload.message_type,
        attachment_url=payload.attachment_url,
        attachment_name=payload.attachment_name,
        is_read=False
    )
    db.add(msg)
    conv.updated_at = msg.created_at
    db.commit()
    db.refresh(msg)

    # 1. Real-time broadcast to all participants in this conversation
    msg_dict = {
        "type": "NEW_MESSAGE",
        "message": {
            "id": msg.id,
            "conversation_id": msg.conversation_id,
            "sender_id": msg.sender_id,
            "sender_name": current_user.full_name,
            "sender_role": msg.sender_role,
            "message_text": msg.message_text,
            "message_type": msg.message_type,
            "attachment_url": msg.attachment_url,
            "attachment_name": msg.attachment_name,
            "is_read": msg.is_read,
            "created_at": msg.created_at.isoformat()
        }
    }
    await ws_manager.broadcast_chat(conversation_id, msg_dict)

    # 2. Push in-app notification to the recipient
    is_doctor = current_user.role == UserRole.DOCTOR.value
    recipient_user_id = conv.parent_id if is_doctor else conv.appointment.doctor.user_id
    sender_title = f"Dr. {current_user.full_name}" if is_doctor else current_user.full_name

    await create_notification(
        db,
        user_id=recipient_user_id,
        title=f"New message from {sender_title}",
        message=msg.message_text[:80] + ("..." if len(msg.message_text) > 80 else ""),
        notification_type=NotificationType.CHAT.value,
        related_entity_id=str(conv.id)
    )

    return msg

@router.post("/upload")
async def upload_chat_attachment(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user)
):
    # Validate extension
    allowed_exts = {".png", ".jpg", ".jpeg", ".pdf", ".webp"}
    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in allowed_exts:
        raise HTTPException(
            status_code=400,
            detail=f"File type '{ext}' not supported. Allowed formats: {', '.join(allowed_exts)}"
        )

    unique_filename = f"chat_{uuid.uuid4().hex[:12]}{ext}"
    chat_upload_dir = os.path.join(settings.UPLOAD_DIR, "chat")
    os.makedirs(chat_upload_dir, exist_ok=True)
    destination = os.path.join(chat_upload_dir, unique_filename)

    with open(destination, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    return {
        "attachment_url": f"/uploads/chat/{unique_filename}",
        "attachment_name": file.filename,
        "message_type": "IMAGE" if ext in {".png", ".jpg", ".jpeg", ".webp"} else "DOCUMENT"
    }

@router.put("/conversations/{conversation_id}/read")
def mark_conversation_read(
    conversation_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    conv = get_conversation_authorized(conversation_id, current_user, db)
    db.query(Message).filter(
        Message.conversation_id == conv.id,
        Message.sender_id != current_user.id,
        Message.is_read == False
    ).update({"is_read": True})
    db.commit()
    return {"status": "success"}
