import enum
from datetime import datetime, timezone
from sqlalchemy import (
    Column, Integer, String, Boolean, DateTime, Date, Time, Text,
    ForeignKey, Float, Enum as SQLEnum, UniqueConstraint, Index
)
from sqlalchemy.orm import relationship
from app.core.database import Base

def utc_now():
    return datetime.now(timezone.utc)

class UserRole(str, enum.Enum):
    PARENT = "PARENT"
    DOCTOR = "DOCTOR"
    ADMIN = "ADMIN"

class AppointmentStatus(str, enum.Enum):
    PENDING = "PENDING"
    CONFIRMED = "CONFIRMED"
    IN_PROGRESS = "IN_PROGRESS"
    COMPLETED = "COMPLETED"
    CANCELLED = "CANCELLED"
    RESCHEDULED = "RESCHEDULED"

class MessageType(str, enum.Enum):
    TEXT = "TEXT"
    IMAGE = "IMAGE"
    DOCUMENT = "DOCUMENT"
    PRESCRIPTION = "PRESCRIPTION"

class NotificationType(str, enum.Enum):
    APPOINTMENT = "APPOINTMENT"
    CHAT = "CHAT"
    PRESCRIPTION = "PRESCRIPTION"
    FOLLOW_UP = "FOLLOW_UP"
    SYSTEM = "SYSTEM"

class RecordType(str, enum.Enum):
    LAB_REPORT = "LAB_REPORT"
    VACCINATION = "VACCINATION"
    IMAGING = "IMAGING"
    CONSULTATION_NOTE = "CONSULTATION_NOTE"
    OTHER = "OTHER"

# 1. Users
class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(255), nullable=False)
    phone_number = Column(String(50), nullable=True)
    role = Column(String(20), default=UserRole.PARENT.value, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=utc_now, nullable=False)
    updated_at = Column(DateTime, default=utc_now, onupdate=utc_now, nullable=False)
    
    # Relationships
    doctor_profile = relationship("Doctor", back_populates="user", uselist=False, cascade="all, delete-orphan")
    children = relationship("Child", back_populates="parent", cascade="all, delete-orphan")
    parent_appointments = relationship("Appointment", foreign_keys="Appointment.parent_id", back_populates="parent")
    notifications = relationship("Notification", back_populates="user", cascade="all, delete-orphan")
    audit_logs = relationship("AuditLog", back_populates="user")

# 2. Doctors
class Doctor(Base):
    __tablename__ = "doctors"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)
    specialization = Column(String(255), default="General Pediatrics", nullable=False)
    qualification = Column(String(255), default="MBBS, MD (Pediatrics)", nullable=False)
    experience_years = Column(Integer, default=5, nullable=False)
    license_number = Column(String(100), unique=True, nullable=False)
    bio = Column(Text, nullable=True)
    consultation_fee = Column(Float, default=500.0, nullable=False)
    hospital_affiliation = Column(String(255), default="CareConnect Children's Clinic", nullable=True)
    is_verified = Column(Boolean, default=False, nullable=False)
    rating = Column(Float, default=4.9, nullable=False)
    created_at = Column(DateTime, default=utc_now, nullable=False)
    
    # Relationships
    user = relationship("User", back_populates="doctor_profile")
    availabilities = relationship("DoctorAvailability", back_populates="doctor", cascade="all, delete-orphan")
    blocked_dates = relationship("DoctorBlockedDate", back_populates="doctor", cascade="all, delete-orphan")
    appointments = relationship("Appointment", back_populates="doctor")
    prescriptions = relationship("Prescription", back_populates="doctor")

# 3. Children
class Child(Base):
    __tablename__ = "children"
    
    id = Column(Integer, primary_key=True, index=True)
    parent_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    full_name = Column(String(255), nullable=False)
    date_of_birth = Column(Date, nullable=False)
    gender = Column(String(20), nullable=True)
    blood_group = Column(String(10), nullable=True)
    allergies = Column(Text, nullable=True)
    existing_conditions = Column(Text, nullable=True)
    medical_history = Column(Text, nullable=True)
    created_at = Column(DateTime, default=utc_now, nullable=False)
    updated_at = Column(DateTime, default=utc_now, onupdate=utc_now, nullable=False)
    
    # Relationships
    parent = relationship("User", back_populates="children")
    appointments = relationship("Appointment", back_populates="child", cascade="all, delete-orphan")
    prescriptions = relationship("Prescription", back_populates="child")
    medical_records = relationship("MedicalRecord", back_populates="child", cascade="all, delete-orphan")

# 4. Doctor Availability
class DoctorAvailability(Base):
    __tablename__ = "doctor_availabilities"
    
    id = Column(Integer, primary_key=True, index=True)
    doctor_id = Column(Integer, ForeignKey("doctors.id", ondelete="CASCADE"), nullable=False, index=True)
    day_of_week = Column(Integer, nullable=False)  # 0=Monday, 6=Sunday
    start_time = Column(String(10), nullable=False)  # "09:00"
    end_time = Column(String(10), nullable=False)    # "17:00"
    slot_duration_minutes = Column(Integer, default=30, nullable=False)
    break_start_time = Column(String(10), nullable=True) # "13:00"
    break_end_time = Column(String(10), nullable=True)   # "14:00"
    is_active = Column(Boolean, default=True, nullable=False)
    
    doctor = relationship("Doctor", back_populates="availabilities")
    
    __table_args__ = (
        UniqueConstraint('doctor_id', 'day_of_week', name='uq_doctor_day'),
    )

# 5. Doctor Blocked Dates
class DoctorBlockedDate(Base):
    __tablename__ = "doctor_blocked_dates"
    
    id = Column(Integer, primary_key=True, index=True)
    doctor_id = Column(Integer, ForeignKey("doctors.id", ondelete="CASCADE"), nullable=False, index=True)
    blocked_date = Column(Date, nullable=False)
    reason = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=utc_now, nullable=False)
    
    doctor = relationship("Doctor", back_populates="blocked_dates")
    
    __table_args__ = (
        UniqueConstraint('doctor_id', 'blocked_date', name='uq_doctor_blocked_date'),
    )

# 6. Appointments
class Appointment(Base):
    __tablename__ = "appointments"
    
    id = Column(Integer, primary_key=True, index=True)
    appointment_number = Column(String(50), unique=True, index=True, nullable=False)
    child_id = Column(Integer, ForeignKey("children.id", ondelete="CASCADE"), nullable=False, index=True)
    parent_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    doctor_id = Column(Integer, ForeignKey("doctors.id", ondelete="CASCADE"), nullable=False, index=True)
    
    appointment_date = Column(Date, nullable=False, index=True)
    start_time = Column(String(10), nullable=False)  # "10:00"
    end_time = Column(String(10), nullable=False)    # "10:30"
    status = Column(String(20), default=AppointmentStatus.PENDING.value, nullable=False, index=True)
    reason = Column(Text, nullable=False)
    consultation_room_id = Column(String(100), unique=True, nullable=False)
    cancellation_reason = Column(Text, nullable=True)
    created_at = Column(DateTime, default=utc_now, nullable=False)
    updated_at = Column(DateTime, default=utc_now, onupdate=utc_now, nullable=False)
    
    # Relationships
    child = relationship("Child", back_populates="appointments")
    parent = relationship("User", foreign_keys=[parent_id], back_populates="parent_appointments")
    doctor = relationship("Doctor", back_populates="appointments")
    consultation = relationship("Consultation", back_populates="appointment", uselist=False, cascade="all, delete-orphan")
    conversation = relationship("Conversation", back_populates="appointment", uselist=False, cascade="all, delete-orphan")
    prescription = relationship("Prescription", back_populates="appointment", uselist=False)
    
    __table_args__ = (
        # Prevent double booking: Doctor cannot have overlapping active slot
        Index('ix_doctor_date_slot', 'doctor_id', 'appointment_date', 'start_time'),
    )

# 7. Consultations
class Consultation(Base):
    __tablename__ = "consultations"
    
    id = Column(Integer, primary_key=True, index=True)
    appointment_id = Column(Integer, ForeignKey("appointments.id", ondelete="CASCADE"), unique=True, nullable=False)
    doctor_notes = Column(Text, nullable=True)
    diagnosis = Column(Text, nullable=True)
    started_at = Column(DateTime, nullable=True)
    ended_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=utc_now, nullable=False)
    updated_at = Column(DateTime, default=utc_now, onupdate=utc_now, nullable=False)
    
    appointment = relationship("Appointment", back_populates="consultation")
    prescription = relationship("Prescription", back_populates="consultation", uselist=False)

# 8. Conversations
class Conversation(Base):
    __tablename__ = "conversations"
    
    id = Column(Integer, primary_key=True, index=True)
    appointment_id = Column(Integer, ForeignKey("appointments.id", ondelete="CASCADE"), unique=True, nullable=False)
    parent_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    doctor_id = Column(Integer, ForeignKey("doctors.id", ondelete="CASCADE"), nullable=False, index=True)
    child_id = Column(Integer, ForeignKey("children.id", ondelete="CASCADE"), nullable=False, index=True)
    created_at = Column(DateTime, default=utc_now, nullable=False)
    updated_at = Column(DateTime, default=utc_now, onupdate=utc_now, nullable=False)
    
    appointment = relationship("Appointment", back_populates="conversation")
    messages = relationship("Message", back_populates="conversation", cascade="all, delete-orphan", order_by="Message.created_at")

# 9. Messages
class Message(Base):
    __tablename__ = "messages"
    
    id = Column(Integer, primary_key=True, index=True)
    conversation_id = Column(Integer, ForeignKey("conversations.id", ondelete="CASCADE"), nullable=False, index=True)
    sender_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    sender_role = Column(String(20), nullable=False)
    message_text = Column(Text, nullable=False)
    message_type = Column(String(20), default=MessageType.TEXT.value, nullable=False)
    attachment_url = Column(String(500), nullable=True)
    attachment_name = Column(String(255), nullable=True)
    is_read = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime, default=utc_now, nullable=False, index=True)
    
    conversation = relationship("Conversation", back_populates="messages")
    sender = relationship("User")

# 10. Prescriptions
class Prescription(Base):
    __tablename__ = "prescriptions"
    
    id = Column(Integer, primary_key=True, index=True)
    prescription_number = Column(String(50), unique=True, index=True, nullable=False)
    appointment_id = Column(Integer, ForeignKey("appointments.id", ondelete="CASCADE"), unique=True, nullable=False)
    consultation_id = Column(Integer, ForeignKey("consultations.id", ondelete="SET NULL"), nullable=True)
    doctor_id = Column(Integer, ForeignKey("doctors.id", ondelete="CASCADE"), nullable=False, index=True)
    child_id = Column(Integer, ForeignKey("children.id", ondelete="CASCADE"), nullable=False, index=True)
    parent_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    
    diagnosis = Column(Text, nullable=False)
    additional_advice = Column(Text, nullable=True)
    follow_up_date = Column(Date, nullable=True)
    pdf_file_path = Column(String(500), nullable=True)
    created_at = Column(DateTime, default=utc_now, nullable=False)
    
    doctor = relationship("Doctor", back_populates="prescriptions")
    child = relationship("Child", back_populates="prescriptions")
    parent = relationship("User")
    appointment = relationship("Appointment", back_populates="prescription")
    consultation = relationship("Consultation", back_populates="prescription")
    items = relationship("PrescriptionItem", back_populates="prescription", cascade="all, delete-orphan")

# 11. Prescription Items
class PrescriptionItem(Base):
    __tablename__ = "prescription_items"
    
    id = Column(Integer, primary_key=True, index=True)
    prescription_id = Column(Integer, ForeignKey("prescriptions.id", ondelete="CASCADE"), nullable=False, index=True)
    medicine_name = Column(String(255), nullable=False)
    dosage = Column(String(100), nullable=False)             # e.g., "5ml" or "100mg"
    frequency = Column(String(100), nullable=False)          # e.g., "Twice daily after meals"
    duration = Column(String(100), nullable=False)           # e.g., "5 days"
    instructions = Column(String(255), nullable=True)        # e.g., "Shake well before use"
    
    prescription = relationship("Prescription", back_populates="items")

# 12. Medical Records
class MedicalRecord(Base):
    __tablename__ = "medical_records"
    
    id = Column(Integer, primary_key=True, index=True)
    child_id = Column(Integer, ForeignKey("children.id", ondelete="CASCADE"), nullable=False, index=True)
    uploaded_by_user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    title = Column(String(255), nullable=False)
    record_type = Column(String(50), default=RecordType.LAB_REPORT.value, nullable=False)
    file_path = Column(String(500), nullable=False)
    file_name = Column(String(255), nullable=False)
    file_size_bytes = Column(Integer, nullable=True)
    mime_type = Column(String(100), nullable=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=utc_now, nullable=False)
    
    child = relationship("Child", back_populates="medical_records")
    uploader = relationship("User")

# 13. Notifications
class Notification(Base):
    __tablename__ = "notifications"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String(255), nullable=False)
    message = Column(Text, nullable=False)
    notification_type = Column(String(50), default=NotificationType.SYSTEM.value, nullable=False)
    related_entity_id = Column(String(100), nullable=True)
    is_read = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime, default=utc_now, nullable=False, index=True)
    
    user = relationship("User", back_populates="notifications")

# 14. Audit Logs
class AuditLog(Base):
    __tablename__ = "audit_logs"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    action = Column(String(100), nullable=False)
    entity_type = Column(String(100), nullable=False)
    entity_id = Column(String(100), nullable=True)
    ip_address = Column(String(50), nullable=True)
    user_agent = Column(String(255), nullable=True)
    details = Column(Text, nullable=True)
    created_at = Column(DateTime, default=utc_now, nullable=False, index=True)
    
    user = relationship("User", back_populates="audit_logs")
