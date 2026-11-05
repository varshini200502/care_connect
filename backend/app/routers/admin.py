from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import get_current_user, require_role
from app.models.models import User, Doctor, Child, Appointment, Prescription, AuditLog, UserRole
from app.schemas.schemas import AdminStatsOut, UserOut, AuditLogOut
from app.services.audit_service import log_audit

router = APIRouter(prefix="/admin", tags=["Admin Portal"], dependencies=[Depends(require_role([UserRole.ADMIN.value]))])

@router.get("/stats", response_model=AdminStatsOut)
def get_admin_dashboard_stats(db: Session = Depends(get_db)):
    total_users = db.query(User).count()
    total_parents = db.query(User).filter(User.role == UserRole.PARENT.value).count()
    total_doctors = db.query(Doctor).count()
    total_children = db.query(Child).count()
    total_appointments = db.query(Appointment).count()
    total_prescriptions = db.query(Prescription).count()
    pending_verifications = db.query(Doctor).filter(Doctor.is_verified == False).count()

    recent_logs = db.query(AuditLog).order_by(AuditLog.created_at.desc()).limit(15).all()

    return AdminStatsOut(
        total_users=total_users,
        total_parents=total_parents,
        total_doctors=total_doctors,
        total_children=total_children,
        total_appointments=total_appointments,
        total_prescriptions=total_prescriptions,
        pending_verifications=pending_verifications,
        recent_activity=recent_logs
    )

@router.get("/users", response_model=List[UserOut])
def get_all_users(
    role: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(User)
    if role:
        query = query.filter(User.role == role.upper())
    return query.order_by(User.created_at.desc()).all()

@router.put("/users/{user_id}/toggle-status", response_model=UserOut)
def toggle_user_active_status(
    user_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if user_id == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot deactivate your own administrator account.")

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")

    user.is_active = not user.is_active
    db.commit()
    db.refresh(user)

    log_audit(
        db,
        action="USER_STATUS_TOGGLE",
        entity_type="User",
        user_id=current_user.id,
        entity_id=str(user.id),
        details=f"User status set to active={user.is_active}"
    )
    return user

@router.put("/doctors/{doctor_id}/verify")
def verify_doctor(
    doctor_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    doctor = db.query(Doctor).filter(Doctor.id == doctor_id).first()
    if not doctor:
        raise HTTPException(status_code=404, detail="Doctor not found.")

    doctor.is_verified = not doctor.is_verified
    db.commit()

    log_audit(
        db,
        action="DOCTOR_VERIFICATION_TOGGLE",
        entity_type="Doctor",
        user_id=current_user.id,
        entity_id=str(doctor.id),
        details=f"Doctor verification status set to {doctor.is_verified}"
    )
    return {"status": "success", "is_verified": doctor.is_verified}

@router.get("/audit-logs", response_model=List[AuditLogOut])
def get_audit_logs(
    limit: int = 50,
    db: Session = Depends(get_db)
):
    return db.query(AuditLog).order_by(AuditLog.created_at.desc()).limit(limit).all()
