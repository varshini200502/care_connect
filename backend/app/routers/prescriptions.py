import os
import uuid
from datetime import datetime, date
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import get_current_user
from app.models.models import (
    Prescription, PrescriptionItem, Appointment, Consultation,
    Child, Doctor, User, UserRole, NotificationType, Message, MessageType
)
from app.schemas.schemas import PrescriptionCreate, PrescriptionOut
from app.services.pdf_service import generate_prescription_pdf
from app.services.notification_service import create_notification
from app.services.websocket_manager import ws_manager
from app.services.audit_service import log_audit
from app.core.config import settings

router = APIRouter(prefix="/prescriptions", tags=["Digital Prescriptions"])

@router.post("/", response_model=PrescriptionOut, status_code=status.HTTP_201_CREATED)
async def create_prescription(
    payload: PrescriptionCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.role != UserRole.DOCTOR.value or not current_user.doctor_profile:
        raise HTTPException(status_code=403, detail="Only doctors can issue digital prescriptions.")

    doctor = current_user.doctor_profile

    # 1. Verify Appointment
    appointment = db.query(Appointment).filter(Appointment.id == payload.appointment_id).first()
    if not appointment:
        raise HTTPException(status_code=404, detail="Appointment not found.")

    if appointment.doctor_id != doctor.id:
        raise HTTPException(status_code=403, detail="You can only prescribe for your own appointments.")

    existing_rx = db.query(Prescription).filter(Prescription.appointment_id == appointment.id).first()
    if existing_rx:
        raise HTTPException(status_code=400, detail="A prescription has already been created for this appointment.")

    # 2. Generate Prescription Number
    unique_suffix = uuid.uuid4().hex[:6].upper()
    date_compact = date.today().strftime("%Y%m%d")
    rx_number = f"RX-{date_compact}-{unique_suffix}"

    child = appointment.child
    parent = appointment.parent

    # 3. Generate PDF Document using ReportLab
    pdf_path = generate_prescription_pdf(
        prescription_number=rx_number,
        doctor_name=current_user.full_name,
        doctor_qualification=doctor.qualification,
        doctor_license=doctor.license_number,
        doctor_specialization=doctor.specialization,
        doctor_hospital=doctor.hospital_affiliation or "CareConnect Pediatric Clinic",
        child_name=child.full_name,
        child_dob=child.date_of_birth,
        child_gender=child.gender or "N/A",
        child_blood_group=child.blood_group or "N/A",
        parent_name=parent.full_name,
        consultation_date=appointment.appointment_date,
        diagnosis=payload.diagnosis,
        additional_advice=payload.additional_advice or "",
        follow_up_date=payload.follow_up_date,
        items=payload.items
    )

    # 4. Save in Database
    rx = Prescription(
        prescription_number=rx_number,
        appointment_id=appointment.id,
        consultation_id=appointment.consultation.id if appointment.consultation else None,
        doctor_id=doctor.id,
        child_id=child.id,
        parent_id=parent.id,
        diagnosis=payload.diagnosis,
        additional_advice=payload.additional_advice,
        follow_up_date=payload.follow_up_date,
        pdf_file_path=pdf_path
    )
    db.add(rx)
    db.flush()

    for item_data in payload.items:
        rx_item = PrescriptionItem(
            prescription_id=rx.id,
            medicine_name=item_data.medicine_name.strip(),
            dosage=item_data.dosage.strip(),
            frequency=item_data.frequency.strip(),
            duration=item_data.duration.strip(),
            instructions=item_data.instructions
        )
        db.add(rx_item)

    # Update consultation diagnosis if present
    if appointment.consultation:
        appointment.consultation.diagnosis = payload.diagnosis

    db.commit()
    db.refresh(rx)

    # 5. Automatically post prescription message into Appointment Chat
    if appointment.conversation:
        chat_msg = Message(
            conversation_id=appointment.conversation.id,
            sender_id=current_user.id,
            sender_role=UserRole.DOCTOR.value,
            message_text=f"📋 Digital Prescription Issued (#{rx.prescription_number})\nDiagnosis: {rx.diagnosis}\nPlease download the signed PDF prescription.",
            message_type=MessageType.PRESCRIPTION.value,
            attachment_url=f"/api/prescriptions/{rx.id}/download",
            attachment_name=f"{rx.prescription_number}.pdf",
            is_read=False
        )
        db.add(chat_msg)
        db.commit()
        db.refresh(chat_msg)

        # Broadcast via WebSocket
        await ws_manager.broadcast_chat(appointment.conversation.id, {
            "type": "NEW_MESSAGE",
            "message": {
                "id": chat_msg.id,
                "conversation_id": chat_msg.conversation_id,
                "sender_id": chat_msg.sender_id,
                "sender_name": f"Dr. {current_user.full_name}",
                "sender_role": chat_msg.sender_role,
                "message_text": chat_msg.message_text,
                "message_type": chat_msg.message_type,
                "attachment_url": chat_msg.attachment_url,
                "attachment_name": chat_msg.attachment_name,
                "is_read": False,
                "created_at": chat_msg.created_at.isoformat()
            }
        })

    # 6. Push In-App Notification to Parent
    await create_notification(
        db,
        user_id=parent.id,
        title="Digital Prescription Received",
        message=f"Dr. {current_user.full_name} has generated digital prescription #{rx.prescription_number} for {child.full_name}.",
        notification_type=NotificationType.PRESCRIPTION.value,
        related_entity_id=str(rx.id)
    )

    log_audit(
        db,
        action="CREATE_PRESCRIPTION",
        entity_type="Prescription",
        user_id=current_user.id,
        entity_id=str(rx.id),
        details=f"Prescription {rx.prescription_number} generated for child {child.full_name}"
    )

    return rx

@router.get("/{prescription_id}", response_model=PrescriptionOut)
def get_prescription_by_id(
    prescription_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    rx = db.query(Prescription).filter(Prescription.id == prescription_id).first()
    if not rx:
        raise HTTPException(status_code=404, detail="Prescription not found.")

    is_parent = rx.parent_id == current_user.id
    is_doctor = current_user.doctor_profile and rx.doctor_id == current_user.doctor_profile.id
    is_admin = current_user.role == UserRole.ADMIN.value

    if not (is_parent or is_doctor or is_admin):
        raise HTTPException(status_code=403, detail="You do not have permission to view this prescription.")

    return rx

@router.get("/{prescription_id}/download")
def download_prescription_pdf(
    prescription_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    rx = db.query(Prescription).filter(Prescription.id == prescription_id).first()
    if not rx:
        raise HTTPException(status_code=404, detail="Prescription not found.")

    is_parent = rx.parent_id == current_user.id
    is_doctor = current_user.doctor_profile and rx.doctor_id == current_user.doctor_profile.id
    is_admin = current_user.role == UserRole.ADMIN.value

    if not (is_parent or is_doctor or is_admin):
        raise HTTPException(status_code=403, detail="You do not have permission to download this prescription.")

    if not rx.pdf_file_path or not os.path.exists(rx.pdf_file_path):
        # Regenerate if file missing
        rx.pdf_file_path = generate_prescription_pdf(
            prescription_number=rx.prescription_number,
            doctor_name=rx.doctor.user.full_name,
            doctor_qualification=rx.doctor.qualification,
            doctor_license=rx.doctor.license_number,
            doctor_specialization=rx.doctor.specialization,
            doctor_hospital=rx.doctor.hospital_affiliation or "CareConnect Pediatric Clinic",
            child_name=rx.child.full_name,
            child_dob=rx.child.date_of_birth,
            child_gender=rx.child.gender or "N/A",
            child_blood_group=rx.child.blood_group or "N/A",
            parent_name=rx.parent.full_name,
            consultation_date=rx.created_at.date(),
            diagnosis=rx.diagnosis,
            additional_advice=rx.additional_advice or "",
            follow_up_date=rx.follow_up_date,
            items=rx.items
        )
        db.commit()

    return FileResponse(
        rx.pdf_file_path,
        media_type="application/pdf",
        filename=f"{rx.prescription_number}.pdf"
    )

@router.get("/child/{child_id}", response_model=List[PrescriptionOut])
def get_child_prescriptions(
    child_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    child = db.query(Child).filter(Child.id == child_id).first()
    if not child:
        raise HTTPException(status_code=404, detail="Child not found.")

    is_parent = child.parent_id == current_user.id
    is_doctor = current_user.role == UserRole.DOCTOR.value
    is_admin = current_user.role == UserRole.ADMIN.value

    if not (is_parent or is_doctor or is_admin):
        raise HTTPException(status_code=403, detail="Access denied.")

    return db.query(Prescription).filter(Prescription.child_id == child_id).order_by(Prescription.created_at.desc()).all()
