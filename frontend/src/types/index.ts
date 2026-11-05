export type UserRole = 'PARENT' | 'DOCTOR' | 'ADMIN';

export interface User {
  id: number;
  email: string;
  full_name: string;
  phone_number?: string;
  role: UserRole;
  is_active: boolean;
  created_at: string;
  doctor_profile?: Doctor;
}

export interface Doctor {
  id: number;
  user_id: number;
  specialization: string;
  qualification: string;
  experience_years: number;
  license_number: string;
  bio?: string;
  consultation_fee: number;
  hospital_affiliation?: string;
  is_verified: boolean;
  rating: number;
  user: {
    email: string;
    full_name: string;
    phone_number?: string;
  };
}

export interface Child {
  id: number;
  parent_id: number;
  full_name: string;
  date_of_birth: string;
  gender?: string;
  blood_group?: string;
  allergies?: string;
  existing_conditions?: string;
  medical_history?: string;
  created_at: string;
  updated_at: string;
}

export interface DoctorAvailability {
  id: number;
  doctor_id: number;
  day_of_week: number;
  start_time: string;
  end_time: string;
  slot_duration_minutes: number;
  break_start_time?: string;
  break_end_time?: string;
  is_active: boolean;
}

export interface Slot {
  start_time: string;
  end_time: string;
  is_available: boolean;
}

export type AppointmentStatus =
  | 'PENDING'
  | 'CONFIRMED'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'RESCHEDULED';

export interface Appointment {
  id: number;
  appointment_number: string;
  child_id: number;
  parent_id: number;
  doctor_id: number;
  appointment_date: string;
  start_time: string;
  end_time: string;
  status: AppointmentStatus;
  reason: string;
  consultation_room_id: string;
  cancellation_reason?: string;
  created_at: string;
  updated_at: string;
  child: Child;
  doctor: Doctor;
  has_prescription?: boolean;
}

export interface PrescriptionItem {
  id?: number;
  medicine_name: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions?: string;
}

export interface Prescription {
  id: number;
  prescription_number: string;
  appointment_id: number;
  doctor_id: number;
  child_id: number;
  parent_id: number;
  diagnosis: string;
  additional_advice?: string;
  follow_up_date?: string;
  pdf_file_path?: string;
  created_at: string;
  items: PrescriptionItem[];
  doctor: Doctor;
  child: Child;
}

export interface Message {
  id: number;
  conversation_id: number;
  sender_id: number;
  sender_role: string;
  sender_name?: string;
  message_text: string;
  message_type: 'TEXT' | 'IMAGE' | 'DOCUMENT' | 'PRESCRIPTION';
  attachment_url?: string;
  attachment_name?: string;
  is_read: boolean;
  created_at: string;
}

export interface Conversation {
  id: number;
  appointment_id: number;
  parent_id: number;
  doctor_id: number;
  child_id: number;
  created_at: string;
  updated_at: string;
  child_name: string;
  doctor_name: string;
  parent_name: string;
  last_message?: Message;
  unread_count: number;
}

export interface MedicalRecord {
  id: number;
  child_id: number;
  uploaded_by_user_id: number;
  title: string;
  record_type: 'LAB_REPORT' | 'VACCINATION' | 'IMAGING' | 'CONSULTATION_NOTE' | 'OTHER';
  file_path: string;
  file_name: string;
  file_size_bytes?: number;
  mime_type?: string;
  notes?: string;
  created_at: string;
}

export interface Notification {
  id: number;
  user_id: number;
  title: string;
  message: string;
  notification_type: 'APPOINTMENT' | 'CHAT' | 'PRESCRIPTION' | 'FOLLOW_UP' | 'SYSTEM';
  related_entity_id?: string;
  is_read: boolean;
  created_at: string;
}

export interface AuditLog {
  id: number;
  user_id?: number;
  action: string;
  entity_type: string;
  entity_id?: string;
  ip_address?: string;
  details?: string;
  created_at: string;
}

export interface AdminStats {
  total_users: number;
  total_parents: number;
  total_doctors: number;
  total_children: number;
  total_appointments: number;
  total_prescriptions: number;
  pending_verifications: number;
  recent_activity: AuditLog[];
}
