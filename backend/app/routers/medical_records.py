import os
import uuid
import shutil
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import get_current_user
from app.models.models import MedicalRecord, Child, User, UserRole, RecordType
from app.schemas.schemas import MedicalRecordOut
from app.core.config import settings

router = APIRouter(prefix="/medical-records", tags=["Medical Records"])

@router.post("/upload", response_model=MedicalRecordOut, status_code=status.HTTP_201_CREATED)
async def upload_medical_record(
    child_id: int = Form(...),
    title: str = Form(...),
    record_type: str = Form("LAB_REPORT"),
    notes: str = Form(""),
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    child = db.query(Child).filter(Child.id == child_id).first()
    if not child:
        raise HTTPException(status_code=404, detail="Child profile not found.")

    if child.parent_id != current_user.id and current_user.role not in [UserRole.DOCTOR.value, UserRole.ADMIN.value]:
        raise HTTPException(status_code=403, detail="You can only upload records for your own children.")

    # Validate file extension
    ext = os.path.splitext(file.filename)[1].lower()
    allowed_exts = {".pdf", ".png", ".jpg", ".jpeg", ".webp"}
    if ext not in allowed_exts:
        raise HTTPException(status_code=400, detail=f"Invalid file type '{ext}'. Allowed: PDF, PNG, JPG, WEBP.")

    unique_filename = f"record_{uuid.uuid4().hex[:12]}{ext}"
    dest_path = os.path.join(settings.MEDICAL_RECORDS_UPLOAD_DIR, unique_filename)

    file_size = 0
    with open(dest_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        file_size = os.path.getsize(dest_path)

    # Max 15MB
    if file_size > 15 * 1024 * 1024:
        os.remove(dest_path)
        raise HTTPException(status_code=400, detail="File size exceeds maximum limit of 15MB.")

    record = MedicalRecord(
        child_id=child.id,
        uploaded_by_user_id=current_user.id,
        title=title.strip(),
        record_type=record_type.upper(),
        file_path=dest_path,
        file_name=file.filename,
        file_size_bytes=file_size,
        mime_type=file.content_type,
        notes=notes.strip() if notes else None
    )
    db.add(record)
    db.commit()
    db.refresh(record)

    return record

@router.get("/child/{child_id}", response_model=List[MedicalRecordOut])
def get_child_medical_records(
    child_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    child = db.query(Child).filter(Child.id == child_id).first()
    if not child:
        raise HTTPException(status_code=404, detail="Child profile not found.")

    is_parent = child.parent_id == current_user.id
    is_doctor = current_user.role == UserRole.DOCTOR.value
    is_admin = current_user.role == UserRole.ADMIN.value

    if not (is_parent or is_doctor or is_admin):
        raise HTTPException(status_code=403, detail="Access denied.")

    return db.query(MedicalRecord).filter(MedicalRecord.child_id == child_id).order_by(MedicalRecord.created_at.desc()).all()

@router.get("/{record_id}/download")
def download_medical_record(
    record_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    record = db.query(MedicalRecord).filter(MedicalRecord.id == record_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="Medical record not found.")

    child = record.child
    is_parent = child.parent_id == current_user.id
    is_doctor = current_user.role == UserRole.DOCTOR.value
    is_admin = current_user.role == UserRole.ADMIN.value

    if not (is_parent or is_doctor or is_admin):
        raise HTTPException(status_code=403, detail="Access denied.")

    if not os.path.exists(record.file_path):
        raise HTTPException(status_code=404, detail="Physical file missing on server.")

    return FileResponse(
        record.file_path,
        filename=record.file_name,
        media_type=record.mime_type or "application/octet-stream"
    )
