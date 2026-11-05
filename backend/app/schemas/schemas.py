from datetime import datetime, date
from typing import Optional, List, Any
from pydantic import BaseModel, Field

# ----------------- Auth & Tokens -----------------
class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: "UserOut"

class TokenData(BaseModel):
    user_id: Optional[int] = None
    role: Optional[str] = None

# ----------------- Users -----------------
class UserBase(BaseModel):
    email: str
    full_name: str
    phone_number: Optional[str] = None

class UserRegister(UserBase):
    password: str = Field(..., min_length=6)
    role: str = "PARENT"  # Default PARENT for public registration

class UserLogin(BaseModel):
    email: str
    password: str

class ForgotPasswordRequest(BaseModel):
    email: str

class ResetPasswordRequest(BaseModel):
    email: str
    temporary_token: str
    new_password: str = Field(..., min_length=6)

class UserOut(UserBase):
    id: int
    role: str
    is_active: bool
    created_at: datetime
    doctor_profile: Optional["DoctorSimpleOut"] = None

    class Config:
        from_attributes = True

# ----------------- Doctors -----------------
class DoctorSimpleOut(BaseModel):
    id: int
    specialization: str
    qualification: str
    experience_years: int
    license_number: str
    consultation_fee: float
    hospital_affiliation: Optional[str] = None
    is_verified: bool
    rating: float

    class Config:
        from_attributes = True

class DoctorOut(DoctorSimpleOut):
    user_id: int
    bio: Optional[str] = None
    user: UserBase

    class Config:
        from_attributes = True

class DoctorAvailabilityBase(BaseModel):
    day_of_week: int = Field(..., ge=0, le=6, description="0=Monday, 6=Sunday")
    start_time: str = Field(..., pattern=r"^\d{2}:\d{2}$")  # "09:00"
    end_time: str = Field(..., pattern=r"^\d{2}:\d{2}$")    # "17:00"
    slot_duration_minutes: int = 30
    break_start_time: Optional[str] = None
    break_end_time: Optional[str] = None
    is_active: bool = True

class DoctorAvailabilityCreate(DoctorAvailabilityBase):
    pass

class DoctorAvailabilityOut(DoctorAvailabilityBase):
    id: int
    doctor_id: int

    class Config:
        from_attributes = True

class DoctorBlockedDateCreate(BaseModel):
    blocked_date: date
    reason: Optional[str] = None

class DoctorBlockedDateOut(DoctorBlockedDateCreate):
    id: int
    doctor_id: int
    created_at: datetime

    class Config:
        from_attributes = True

class SlotOut(BaseModel):
    start_time: str
    end_time: str
    is_available: bool

# ----------------- Children -----------------
class ChildBase(BaseModel):
    full_name: str
    date_of_birth: date
    gender: Optional[str] = None
    blood_group: Optional[str] = None
    allergies: Optional[str] = None
    existing_conditions: Optional[str] = None
    medical_history: Optional[str] = None

class ChildCreate(ChildBase):
    pass

class ChildUpdate(BaseModel):
    full_name: Optional[str] = None
    date_of_birth: Optional[date] = None
    gender: Optional[str] = None
    blood_group: Optional[str] = None
    allergies: Optional[str] = None
    existing_conditions: Optional[str] = None
    medical_history: Optional[str] = None

class ChildOut(ChildBase):
    id: int
    parent_id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

# ----------------- Appointments -----------------
class AppointmentCreate(BaseModel):
    child_id: int
    doctor_id: int
    appointment_date: date
    start_time: str = Field(..., pattern=r"^\d{2}:\d{2}$")
    end_time: str = Field(..., pattern=r"^\d{2}:\d{2}$")
    reason: str = Field(..., min_length=3)

class AppointmentReschedule(BaseModel):
    appointment_date: date
    start_time: str = Field(..., pattern=r"^\d{2}:\d{2}$")
    end_time: str = Field(..., pattern=r"^\d{2}:\d{2}$")
    reason: Optional[str] = None

class AppointmentCancel(BaseModel):
    cancellation_reason: str

class AppointmentStatusUpdate(BaseModel):
    status: str

class AppointmentOut(BaseModel):
    id: int
    appointment_number: str
    child_id: int
    parent_id: int
    doctor_id: int
    appointment_date: date
    start_time: str
    end_time: str
    status: str
    reason: str
    consultation_room_id: str
    cancellation_reason: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    child: ChildOut
    doctor: DoctorOut
    has_prescription: bool = False

    class Config:
        from_attributes = True

# ----------------- Consultations -----------------
class ConsultationCreate(BaseModel):
    appointment_id: int
    doctor_notes: Optional[str] = None
    diagnosis: Optional[str] = None

class ConsultationOut(BaseModel):
    id: int
    appointment_id: int
    doctor_notes: Optional[str] = None
    diagnosis: Optional[str] = None
    started_at: Optional[datetime] = None
    ended_at: Optional[datetime] = None
    created_at: datetime

    class Config:
        from_attributes = True

# ----------------- Prescriptions -----------------
class PrescriptionItemBase(BaseModel):
    medicine_name: str
    dosage: str
    frequency: str
    duration: str
    instructions: Optional[str] = None

class PrescriptionItemCreate(PrescriptionItemBase):
    pass

class PrescriptionItemOut(PrescriptionItemBase):
    id: int
    prescription_id: int

    class Config:
        from_attributes = True

class PrescriptionCreate(BaseModel):
    appointment_id: int
    diagnosis: str
    additional_advice: Optional[str] = None
    follow_up_date: Optional[date] = None
    items: List[PrescriptionItemCreate]

class PrescriptionOut(BaseModel):
    id: int
    prescription_number: str
    appointment_id: int
    doctor_id: int
    child_id: int
    parent_id: int
    diagnosis: str
    additional_advice: Optional[str] = None
    follow_up_date: Optional[date] = None
    pdf_file_path: Optional[str] = None
    created_at: datetime
    items: List[PrescriptionItemOut]
    doctor: DoctorOut
    child: ChildOut

    class Config:
        from_attributes = True

# ----------------- Chat & Messages -----------------
class MessageCreate(BaseModel):
    message_text: str
    message_type: str = "TEXT"
    attachment_url: Optional[str] = None
    attachment_name: Optional[str] = None

class MessageOut(BaseModel):
    id: int
    conversation_id: int
    sender_id: int
    sender_role: str
    message_text: str
    message_type: str
    attachment_url: Optional[str] = None
    attachment_name: Optional[str] = None
    is_read: bool
    created_at: datetime

    class Config:
        from_attributes = True

class ConversationOut(BaseModel):
    id: int
    appointment_id: int
    parent_id: int
    doctor_id: int
    child_id: int
    created_at: datetime
    updated_at: datetime
    child_name: str
    doctor_name: str
    parent_name: str
    last_message: Optional[MessageOut] = None
    unread_count: int = 0

# ----------------- Medical Records -----------------
class MedicalRecordOut(BaseModel):
    id: int
    child_id: int
    uploaded_by_user_id: int
    title: str
    record_type: str
    file_path: str
    file_name: str
    file_size_bytes: Optional[int] = None
    mime_type: Optional[str] = None
    notes: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

# ----------------- Notifications -----------------
class NotificationOut(BaseModel):
    id: int
    user_id: int
    title: str
    message: str
    notification_type: str
    related_entity_id: Optional[str] = None
    is_read: bool
    created_at: datetime

    class Config:
        from_attributes = True

# ----------------- Audit Logs & Admin -----------------
class AuditLogOut(BaseModel):
    id: int
    user_id: Optional[int] = None
    action: str
    entity_type: str
    entity_id: Optional[str] = None
    ip_address: Optional[str] = None
    details: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

class AdminStatsOut(BaseModel):
    total_users: int
    total_parents: int
    total_doctors: int
    total_children: int
    total_appointments: int
    total_prescriptions: int
    pending_verifications: int
    recent_activity: List[AuditLogOut]
