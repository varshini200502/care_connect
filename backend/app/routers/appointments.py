import uuid
from datetime import datetime, date
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import get_current_user
from app.models.models import (
    Appointment, AppointmentStatus, Child, Doctor, User, UserRole,
    Conversation, Consultation, NotificationType
)
from app.schemas.schemas import (
    AppointmentCreate, AppointmentReschedule, AppointmentCancel,
    AppointmentStatusUpdate, AppointmentOut
)
from app.services.notification_service import create_notification
from app.services.audit_service import log_audit
from app.core.config import settings

router = APIRouter(prefix="/appointments", tags=["Appointments"])

@router.post("/", response_model=AppointmentOut, status_code=status.HTTP_201_CREATED)
async def book_appointment(
    payload: AppointmentCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.role != UserRole.PARENT.value:
        raise HTTPException(status_code=403, detail="Only parents can book appointments.")

    # 1. Verify Child ownership
    child = db.query(Child).filter(Child.id == payload.child_id, Child.parent_id == current_user.id).first()
    if not child:
        raise HTTPException(status_code=404, detail="Child profile not found or does not belong to you.")

    # 2. Verify Doctor exists
    doctor = db.query(Doctor).filter(Doctor.id == payload.doctor_id).first()
    if not doctor:
        raise HTTPException(status_code=404, detail="Doctor not found.")

    # 3. Double-Booking Prevention Rule (Critical Security & Integrity check)
    conflict = db.query(Appointment).filter(
        Appointment.doctor_id == payload.doctor_id,
        Appointment.appointment_date == payload.appointment_date,
        Appointment.start_time == payload.start_time,
        Appointment.status.in_([
            AppointmentStatus.PENDING.value,
            AppointmentStatus.CONFIRMED.value,
            AppointmentStatus.IN_PROGRESS.value
        ])
    ).first()

    if conflict:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="This appointment slot was just booked by another parent. Please select another time slot."
        )

    # 4. Generate Unique Identifiers
    unique_suffix = uuid.uuid4().hex[:6].upper()
    date_compact = payload.appointment_date.strftime("%Y%m%d")
    appt_number = f"APT-{date_compact}-{unique_suffix}"
    room_id = f"{settings.JITSI_ROOM_PREFIX}{uuid.uuid4().hex[:12]}"

    # 5. Create Appointment
    appointment = Appointment(
        appointment_number=appt_number,
        child_id=child.id,
        parent_id=current_user.id,
        doctor_id=doctor.id,
        appointment_date=payload.appointment_date,
        start_time=payload.start_time,
        end_time=payload.end_time,
        status=AppointmentStatus.CONFIRMED.value,  # Auto-confirm available slot
        reason=payload.reason.strip(),
        consultation_room_id=room_id
    )
    db.add(appointment)
    db.flush()

    # 6. Initialize Consultation Record
    consultation = Consultation(
        appointment_id=appointment.id,
        doctor_notes="",
        diagnosis=""
    )
    db.add(consultation)

    # 7. Initialize Dedicated Chat Conversation for this Appointment
    conversation = Conversation(
        appointment_id=appointment.id,
        parent_id=current_user.id,
        doctor_id=doctor.id,
        child_id=child.id
    )
    db.add(conversation)

    db.commit()
    db.refresh(appointment)

    # 8. Notifications
    await create_notification(
        db,
        user_id=doctor.user_id,
        title="New Appointment Scheduled",
        message=f"Appointment #{appointment.appointment_number} booked for {child.full_name} on {appointment.appointment_date} at {appointment.start_time}.",
        notification_type=NotificationType.APPOINTMENT.value,
        related_entity_id=str(appointment.id)
    )

    await create_notification(
        db,
        user_id=current_user.id,
        title="Appointment Confirmed",
        message=f"Your consultation with Dr. {doctor.user.full_name} for {child.full_name} is confirmed for {appointment.appointment_date} at {appointment.start_time}.",
        notification_type=NotificationType.APPOINTMENT.value,
        related_entity_id=str(appointment.id)
    )

    log_audit(
        db,
        action="BOOK_APPOINTMENT",
        entity_type="Appointment",
        user_id=current_user.id,
        entity_id=str(appointment.id),
        details=f"Booked slot {appointment.start_time} on {appointment.appointment_date}"
    )

    return appointment

@router.get("/", response_model=List[AppointmentOut])
def get_user_appointments(
    status_filter: Optional[str] = Query(None, alias="status"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    query = db.query(Appointment)
    if current_user.role == UserRole.PARENT.value:
        query = query.filter(Appointment.parent_id == current_user.id)
    elif current_user.role == UserRole.DOCTOR.value and current_user.doctor_profile:
        query = query.filter(Appointment.doctor_id == current_user.doctor_profile.id)
    # Admin sees all

    if status_filter:
        query = query.filter(Appointment.status == status_filter.upper())

    appointments = query.order_by(Appointment.appointment_date.desc(), Appointment.start_time.desc()).all()
    
    # Check if each has a prescription
    for a in appointments:
        a.has_prescription = a.prescription is not None

    return appointments

@router.get("/{appointment_id}", response_model=AppointmentOut)
def get_appointment_details(
    appointment_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    appointment = db.query(Appointment).filter(Appointment.id == appointment_id).first()
    if not appointment:
        raise HTTPException(status_code=404, detail="Appointment not found.")

    is_authorized = (
        current_user.role == UserRole.ADMIN.value or
        appointment.parent_id == current_user.id or
        (current_user.doctor_profile and appointment.doctor_id == current_user.doctor_profile.id)
    )
    if not is_authorized:
        raise HTTPException(status_code=403, detail="You do not have permission to view this appointment.")

    appointment.has_prescription = appointment.prescription is not None
    return appointment

@router.put("/{appointment_id}/status", response_model=AppointmentOut)
async def update_appointment_status(
    appointment_id: int,
    payload: AppointmentStatusUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    appointment = db.query(Appointment).filter(Appointment.id == appointment_id).first()
    if not appointment:
        raise HTTPException(status_code=404, detail="Appointment not found.")

    # Only doctor or admin can change status to IN_PROGRESS or COMPLETED
    new_status = payload.status.upper()
    appointment.status = new_status

    if new_status == AppointmentStatus.IN_PROGRESS.value and appointment.consultation:
        if not appointment.consultation.started_at:
            appointment.consultation.started_at = datetime.utcnow()
    elif new_status == AppointmentStatus.COMPLETED.value and appointment.consultation:
        if not appointment.consultation.ended_at:
            appointment.consultation.ended_at = datetime.utcnow()

    db.commit()
    db.refresh(appointment)

    # Notify Parent
    await create_notification(
        db,
        user_id=appointment.parent_id,
        title=f"Appointment {new_status.replace('_', ' ').title()}",
        message=f"Your appointment #{appointment.appointment_number} status is now {new_status}.",
        notification_type=NotificationType.APPOINTMENT.value,
        related_entity_id=str(appointment.id)
    )

    return appointment

@router.post("/{appointment_id}/cancel", response_model=AppointmentOut)
async def cancel_appointment(
    appointment_id: int,
    payload: AppointmentCancel,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    appointment = db.query(Appointment).filter(Appointment.id == appointment_id).first()
    if not appointment:
        raise HTTPException(status_code=404, detail="Appointment not found.")

    is_parent = appointment.parent_id == current_user.id
    is_doctor = current_user.doctor_profile and appointment.doctor_id == current_user.doctor_profile.id
    is_admin = current_user.role == UserRole.ADMIN.value

    if not (is_parent or is_doctor or is_admin):
        raise HTTPException(status_code=403, detail="You cannot cancel this appointment.")

    if appointment.status in [AppointmentStatus.COMPLETED.value, AppointmentStatus.CANCELLED.value]:
        raise HTTPException(status_code=400, detail=f"Cannot cancel appointment with status {appointment.status}.")

    appointment.status = AppointmentStatus.CANCELLED.value
    appointment.cancellation_reason = payload.cancellation_reason
    db.commit()
    db.refresh(appointment)

    # Notify other party
    target_user_id = appointment.doctor.user_id if is_parent else appointment.parent_id
    cancelled_by = "Parent" if is_parent else ("Doctor" if is_doctor else "Admin")
    await create_notification(
        db,
        user_id=target_user_id,
        title="Appointment Cancelled",
        message=f"Appointment #{appointment.appointment_number} has been cancelled by {cancelled_by}. Reason: {payload.cancellation_reason}",
        notification_type=NotificationType.APPOINTMENT.value,
        related_entity_id=str(appointment.id)
    )

    log_audit(
        db,
        action="CANCEL_APPOINTMENT",
        entity_type="Appointment",
        user_id=current_user.id,
        entity_id=str(appointment.id),
        details=f"Cancelled with reason: {payload.cancellation_reason}"
    )

    return appointment

@router.post("/{appointment_id}/reschedule", response_model=AppointmentOut)
async def reschedule_appointment(
    appointment_id: int,
    payload: AppointmentReschedule,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    appointment = db.query(Appointment).filter(Appointment.id == appointment_id).first()
    if not appointment:
        raise HTTPException(status_code=404, detail="Appointment not found.")

    if appointment.parent_id != current_user.id and current_user.role != UserRole.ADMIN.value:
        raise HTTPException(status_code=403, detail="You can only reschedule your own appointments.")

    # Check conflict for new slot
    conflict = db.query(Appointment).filter(
        Appointment.doctor_id == appointment.doctor_id,
        Appointment.appointment_date == payload.appointment_date,
        Appointment.start_time == payload.start_time,
        Appointment.id != appointment.id,
        Appointment.status.in_([
            AppointmentStatus.PENDING.value,
            AppointmentStatus.CONFIRMED.value,
            AppointmentStatus.IN_PROGRESS.value
        ])
    ).first()

    if conflict:
        raise HTTPException(status_code=409, detail="The selected reschedule slot is already occupied.")

    old_date = appointment.appointment_date
    old_time = appointment.start_time
    appointment.appointment_date = payload.appointment_date
    appointment.start_time = payload.start_time
    appointment.end_time = payload.end_time
    appointment.status = AppointmentStatus.RESCHEDULED.value
    db.commit()
    db.refresh(appointment)

    # Notify doctor
    await create_notification(
        db,
        user_id=appointment.doctor.user_id,
        title="Appointment Rescheduled",
        message=f"Appointment #{appointment.appointment_number} has been rescheduled from {old_date} {old_time} to {appointment.appointment_date} {appointment.start_time}.",
        notification_type=NotificationType.APPOINTMENT.value,
        related_entity_id=str(appointment.id)
    )

    return appointment
