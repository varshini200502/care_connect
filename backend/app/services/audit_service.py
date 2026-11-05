import logging
from typing import Optional
from sqlalchemy.orm import Session
from app.models.models import AuditLog

logger = logging.getLogger("audit_service")

def log_audit(
    db: Session,
    action: str,
    entity_type: str,
    user_id: Optional[int] = None,
    entity_id: Optional[str] = None,
    ip_address: Optional[str] = None,
    user_agent: Optional[str] = None,
    details: Optional[str] = None
):
    try:
        audit = AuditLog(
            user_id=user_id,
            action=action,
            entity_type=entity_type,
            entity_id=str(entity_id) if entity_id else None,
            ip_address=ip_address,
            user_agent=user_agent,
            details=details
        )
        db.add(audit)
        db.commit()
    except Exception as e:
        logger.error(f"Failed to record audit log: {e}")
        db.rollback()
