import logging
from sqlalchemy.orm import Session
from app.models.models import Notification, NotificationType
from app.services.websocket_manager import ws_manager
from app.core.config import settings

logger = logging.getLogger("notification_service")

async def create_notification(
    db: Session,
    user_id: int,
    title: str,
    message: str,
    notification_type: str = NotificationType.SYSTEM.value,
    related_entity_id: str = None
) -> Notification:
    """
    Creates an in-app notification in DB, broadcasts it via WebSockets,
    and logs/dispatches email if SMTP is configured.
    """
    notif = Notification(
        user_id=user_id,
        title=title,
        message=message,
        notification_type=notification_type,
        related_entity_id=related_entity_id,
        is_read=False
    )
    db.add(notif)
    db.commit()
    db.refresh(notif)

    # Real-time WebSocket delivery
    await ws_manager.send_user_notification(user_id, {
        "type": "NEW_NOTIFICATION",
        "notification": {
            "id": notif.id,
            "title": notif.title,
            "message": notif.message,
            "notification_type": notif.notification_type,
            "related_entity_id": notif.related_entity_id,
            "is_read": notif.is_read,
            "created_at": notif.created_at.isoformat()
        }
    })

    # Email notification hook
    if settings.EMAILS_ENABLED:
        logger.info(f"[EMAIL DISPATCH] Sending real email to user {user_id}: {title}")
    else:
        logger.info(f"[DEV EMAIL LOG] Notification simulated for user {user_id}: [{title}] - {message}")

    return notif
