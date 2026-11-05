from datetime import datetime, date, timedelta, time
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import get_current_user, require_role
from app.models.models import Doctor, DoctorAvailability, DoctorBlockedDate, Appointment, AppointmentStatus, User, UserRole
from app.schemas.schemas import (
    DoctorOut, DoctorAvailabilityCreate, DoctorAvailabilityOut,
    DoctorBlockedDateCreate, DoctorBlockedDateOut, SlotOut
)

router = APIRouter(prefix="/doctors", tags=["Doctors & Availability"])

@router.get("/", response_model=List[DoctorOut])
def get_verified_doctors(db: Session = Depends(get_db)):
    doctors = db.query(Doctor).filter(Doctor.is_verified == True).all()
    # If no verified doctors yet (e.g. initial setup before admin verifies), return all doctors
    if not doctors:
        doctors = db.query(Doctor).all()
    return doctors

@router.get("/{doctor_id}", response_model=DoctorOut)
def get_doctor_by_id(doctor_id: int, db: Session = Depends(get_db)):
    doctor = db.query(Doctor).filter(Doctor.id == doctor_id).first()
    if not doctor:
        raise HTTPException(status_code=404, detail="Doctor not found.")
    return doctor

@router.get("/{doctor_id}/availability", response_model=List[DoctorAvailabilityOut])
def get_doctor_availability(doctor_id: int, db: Session = Depends(get_db)):
    return db.query(DoctorAvailability).filter(
        DoctorAvailability.doctor_id == doctor_id,
        DoctorAvailability.is_active == True
    ).all()

@router.post("/availability", response_model=DoctorAvailabilityOut)
def set_doctor_availability(
    payload: DoctorAvailabilityCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.role != UserRole.DOCTOR.value or not current_user.doctor_profile:
        raise HTTPException(status_code=403, detail="Only doctors can configure their availability.")

    doctor_id = current_user.doctor_profile.id
    avail = db.query(DoctorAvailability).filter(
        DoctorAvailability.doctor_id == doctor_id,
        DoctorAvailability.day_of_week == payload.day_of_week
    ).first()

    if avail:
        avail.start_time = payload.start_time
        avail.end_time = payload.end_time
        avail.slot_duration_minutes = payload.slot_duration_minutes
        avail.break_start_time = payload.break_start_time
        avail.break_end_time = payload.break_end_time
        avail.is_active = payload.is_active
    else:
        avail = DoctorAvailability(
            doctor_id=doctor_id,
            day_of_week=payload.day_of_week,
            start_time=payload.start_time,
            end_time=payload.end_time,
            slot_duration_minutes=payload.slot_duration_minutes,
            break_start_time=payload.break_start_time,
            break_end_time=payload.break_end_time,
            is_active=payload.is_active
        )
        db.add(avail)

    db.commit()
    db.refresh(avail)
    return avail

@router.post("/blocked-dates", response_model=DoctorBlockedDateOut)
def block_doctor_date(
    payload: DoctorBlockedDateCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.role != UserRole.DOCTOR.value or not current_user.doctor_profile:
        raise HTTPException(status_code=403, detail="Only doctors can block dates.")

    doctor_id = current_user.doctor_profile.id
    existing = db.query(DoctorBlockedDate).filter(
        DoctorBlockedDate.doctor_id == doctor_id,
        DoctorBlockedDate.blocked_date == payload.blocked_date
    ).first()

    if existing:
        existing.reason = payload.reason
        db.commit()
        return existing

    blocked = DoctorBlockedDate(
        doctor_id=doctor_id,
        blocked_date=payload.blocked_date,
        reason=payload.reason
    )
    db.add(blocked)
    db.commit()
    db.refresh(blocked)
    return blocked

@router.get("/{doctor_id}/slots", response_model=List[SlotOut])
def get_available_slots(
    doctor_id: int,
    target_date: date = Query(..., alias="date"),
    db: Session = Depends(get_db)
):
    """
    Computes real-time available consultation slots for a doctor on a specific date.
    Removes slots overlapping with:
    1. Blocked dates
    2. Scheduled lunch/tea breaks
    3. Already booked appointments (PENDING, CONFIRMED, IN_PROGRESS)
    """
    # 1. Check if date is blocked
    is_blocked = db.query(DoctorBlockedDate).filter(
        DoctorBlockedDate.doctor_id == doctor_id,
        DoctorBlockedDate.blocked_date == target_date
    ).first()
    if is_blocked:
        return []

    # 2. Get availability configuration for day of week (Python Monday=0 ... Sunday=6)
    day_of_week = target_date.weekday()
    avail = db.query(DoctorAvailability).filter(
        DoctorAvailability.doctor_id == doctor_id,
        DoctorAvailability.day_of_week == day_of_week,
        DoctorAvailability.is_active == True
    ).first()

    if not avail:
        # If no specific record, check if doctor has default fallback or return empty
        return []

    # 3. Get existing active appointments for that day
    existing_appointments = db.query(Appointment).filter(
        Appointment.doctor_id == doctor_id,
        Appointment.appointment_date == target_date,
        Appointment.status.in_([
            AppointmentStatus.PENDING.value,
            AppointmentStatus.CONFIRMED.value,
            AppointmentStatus.IN_PROGRESS.value
        ])
    ).all()
    booked_start_times = {appt.start_time for appt in existing_appointments}

    # 4. Generate all interval slots
    start_dt = datetime.strptime(avail.start_time, "%H:%M")
    end_dt = datetime.strptime(avail.end_time, "%H:%M")
    step = timedelta(minutes=avail.slot_duration_minutes)

    break_start_dt = datetime.strptime(avail.break_start_time, "%H:%M") if avail.break_start_time else None
    break_end_dt = datetime.strptime(avail.break_end_time, "%H:%M") if avail.break_end_time else None

    slots = []
    curr = start_dt
    while curr + step <= end_dt:
        slot_start_str = curr.strftime("%H:%M")
        slot_end_str = (curr + step).strftime("%H:%M")

        # Check if in break
        in_break = False
        if break_start_dt and break_end_dt:
            if not (curr + step <= break_start_dt or curr >= break_end_dt):
                in_break = True

        if not in_break:
            is_available = slot_start_str not in booked_start_times
            slots.append(SlotOut(
                start_time=slot_start_str,
                end_time=slot_end_str,
                is_available=is_available
            ))

        curr += step

    return slots
