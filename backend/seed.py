import sys
import os
from datetime import date, datetime, timedelta

# Ensure backend root is in sys.path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.core.database import SessionLocal, Base, engine
from app.core.config import settings
from app.core.security import get_password_hash
from app.models.models import (
    User, Doctor, Child, DoctorAvailability, Appointment,
    AppointmentStatus, Consultation, Conversation, Message,
    Prescription, PrescriptionItem, MedicalRecord, Notification, UserRole
)
from app.services.pdf_service import generate_prescription_pdf

def seed_database():
    print("Dropping existing tables and recreating schema...")
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    try:
        print("Creating users...")
        # 1. Administrator
        admin = User(
            email="admin@careconnect.com",
            hashed_password=get_password_hash("Admin@123"),
            full_name="CareConnect Admin",
            phone_number="+91 98000 00000",
            role=UserRole.ADMIN.value,
            is_active=True
        )
        db.add(admin)

        # 2. Verified Pediatrician
        doctor_user = User(
            email="dr.sharma@careconnect.com",
            hashed_password=get_password_hash("Doctor@123"),
            full_name="Dr. Rajesh Sharma",
            phone_number="+91 98101 23456",
            role=UserRole.DOCTOR.value,
            is_active=True
        )
        db.add(doctor_user)
        db.flush()

        doctor_profile = Doctor(
            user_id=doctor_user.id,
            specialization="Pediatric & Adolescent Medicine",
            qualification="MBBS, MD (Pediatrics, AIIMS), Fellowship in Pediatric Pulmonology",
            experience_years=12,
            license_number="MCI-DMR-2014-88421",
            bio="Senior Pediatrician with over 12 years of clinical excellence treating infants, toddlers, and adolescents. Special interest in childhood respiratory allergies, developmental milestones, and preventive vaccination.",
            consultation_fee=600.0,
            hospital_affiliation="CareConnect Children's Clinic & Apollo Cradle",
            is_verified=True,
            rating=4.95
        )
        db.add(doctor_profile)
        db.flush()

        # Doctor Availability: Mon (0) to Sat (5)
        for day in range(6):
            avail = DoctorAvailability(
                doctor_id=doctor_profile.id,
                day_of_week=day,
                start_time="09:00",
                end_time="18:00",
                slot_duration_minutes=30,
                break_start_time="13:00",
                break_end_time="14:00",
                is_active=True
            )
            db.add(avail)

        # 3. Parent 1
        parent1 = User(
            email="priya.sharma@gmail.com",
            hashed_password=get_password_hash("Parent@123"),
            full_name="Priya Sharma",
            phone_number="+91 98765 43210",
            role=UserRole.PARENT.value,
            is_active=True
        )
        db.add(parent1)
        db.flush()

        # Children of Parent 1
        child1 = Child(
            parent_id=parent1.id,
            full_name="Aarav Sharma",
            date_of_birth=date(2021, 4, 15), # ~3.5 years
            gender="Male",
            blood_group="B+",
            allergies="Peanuts, Cold air triggers dry cough",
            existing_conditions="Mild reactive airway disease (bronchial hyperactivity)",
            medical_history="Completed primary childhood immunizations up to 2 years. Occasional nocturnal wheeze during season changes."
        )
        db.add(child1)

        child2 = Child(
            parent_id=parent1.id,
            full_name="Ananya Sharma",
            date_of_birth=date(2024, 1, 10), # ~10 months
            gender="Female",
            blood_group="O+",
            allergies="None known",
            existing_conditions="None",
            medical_history="Normal birth weight, meeting developmental motor milestones on schedule. Up to date with MMR & Pneumococcal vaccine."
        )
        db.add(child2)

        # 4. Parent 2
        parent2 = User(
            email="vikram.mehta@gmail.com",
            hashed_password=get_password_hash("Parent@123"),
            full_name="Vikram Mehta",
            phone_number="+91 98112 34567",
            role=UserRole.PARENT.value,
            is_active=True
        )
        db.add(parent2)
        db.flush()

        # Child of Parent 2
        child3 = Child(
            parent_id=parent2.id,
            full_name="Vivaan Mehta",
            date_of_birth=date(2023, 8, 20), # ~15 months
            gender="Male",
            blood_group="A+",
            allergies="Penicillin / Amoxicillin, Cow's milk protein mild sensitivity",
            existing_conditions="Infantile Atopic Eczema",
            medical_history="Diagnosed with atopic dermatitis at 6 months. Responds well to topical emollients and dietary elimination."
        )
        db.add(child3)
        db.flush()

        print("Creating sample appointments & consultations...")
        today = date.today()
        yesterday = today - timedelta(days=1)
        tomorrow = today + timedelta(days=1)

        # Completed Appointment for Vivaan Mehta (with completed consultation & prescription)
        appt_past = Appointment(
            appointment_number="APT-20261104-VIV01",
            child_id=child3.id,
            parent_id=parent2.id,
            doctor_id=doctor_profile.id,
            appointment_date=yesterday,
            start_time="10:00",
            end_time="10:30",
            status=AppointmentStatus.COMPLETED.value,
            reason="Recurrent dry itchy red rash on cheeks and flexural folds; mild runny nose.",
            consultation_room_id="CareConnect-Pediatrics-VIV-001"
        )
        db.add(appt_past)
        db.flush()

        consult_past = Consultation(
            appointment_id=appt_past.id,
            doctor_notes="Child observed in alert, playful state. Erythematous dry eczematous patches on bilateral cheeks and antecubital fossa. Clear rhinorrhea. Lungs clear, no wheeze.",
            diagnosis="Atopic Dermatitis Flare-up with Allergic Rhinitis",
            started_at=datetime.combine(yesterday, datetime.strptime("10:02", "%H:%M").time()),
            ended_at=datetime.combine(yesterday, datetime.strptime("10:28", "%H:%M").time())
        )
        db.add(consult_past)

        conv_past = Conversation(
            appointment_id=appt_past.id,
            parent_id=parent2.id,
            doctor_id=doctor_profile.id,
            child_id=child3.id
        )
        db.add(conv_past)
        db.flush()

        # Past Chat Messages
        msg1 = Message(
            conversation_id=conv_past.id,
            sender_id=parent2.id,
            sender_role=UserRole.PARENT.value,
            message_text="Hello Dr. Sharma, Vivaan has been scratching his cheeks constantly for the last 2 days.",
            created_at=datetime.combine(yesterday, datetime.strptime("09:55", "%H:%M").time())
        )
        msg2 = Message(
            conversation_id=conv_past.id,
            sender_id=doctor_user.id,
            sender_role=UserRole.DOCTOR.value,
            message_text="Hello Vikram. I reviewed your notes and photos. We will discuss skin care, non-steroid barrier repair, and a safe antihistamine in our video consultation.",
            created_at=datetime.combine(yesterday, datetime.strptime("09:58", "%H:%M").time())
        )
        db.add_all([msg1, msg2])

        # Generate Past Prescription & PDF
        rx_past_number = "RX-20261104-VM702"
        rx_items = [
            PrescriptionItem(
                medicine_name="Cetirizine Syrup (5mg/5ml)",
                dosage="2.5 ml",
                frequency="Once daily at bedtime",
                duration="5 Days",
                instructions="For nocturnal itch relief and allergic rhinorrhea"
            ),
            PrescriptionItem(
                medicine_name="Hydrocortisone 1% Pediatric Cream",
                dosage="Fingertip unit",
                frequency="Twice daily",
                duration="3 Days only",
                instructions="Apply thin layer only on active red patches. Do not apply near eyes."
            ),
            PrescriptionItem(
                medicine_name="Ceramide Barrier Repair Emollient (Cetaphil Baby)",
                dosage="Generous amount",
                frequency="3-4 times daily",
                duration="Continuous",
                instructions="Apply within 3 minutes of patting dry after lukewarm bath."
            )
        ]

        pdf_path = generate_prescription_pdf(
            prescription_number=rx_past_number,
            doctor_name=doctor_user.full_name,
            doctor_qualification=doctor_profile.qualification,
            doctor_license=doctor_profile.license_number,
            doctor_specialization=doctor_profile.specialization,
            doctor_hospital=doctor_profile.hospital_affiliation,
            child_name=child3.full_name,
            child_dob=child3.date_of_birth,
            child_gender=child3.gender,
            child_blood_group=child3.blood_group,
            parent_name=parent2.full_name,
            consultation_date=yesterday,
            diagnosis="Atopic Dermatitis Flare-up with Allergic Rhinitis",
            additional_advice="Use only fragrance-free laundry detergent for child's clothing. Bathe in lukewarm water for max 5 minutes.",
            follow_up_date=today + timedelta(days=7),
            items=rx_items
        )

        rx_past = Prescription(
            prescription_number=rx_past_number,
            appointment_id=appt_past.id,
            consultation_id=consult_past.id,
            doctor_id=doctor_profile.id,
            child_id=child3.id,
            parent_id=parent2.id,
            diagnosis="Atopic Dermatitis Flare-up with Allergic Rhinitis",
            additional_advice="Use fragrance-free clothing wash, avoid wool against skin, keep nails trimmed.",
            follow_up_date=today + timedelta(days=7),
            pdf_file_path=pdf_path
        )
        db.add(rx_past)
        db.flush()

        for item in rx_items:
            item.prescription_id = rx_past.id
            db.add(item)

        # Prescription Chat Notification
        msg_rx = Message(
            conversation_id=conv_past.id,
            sender_id=doctor_user.id,
            sender_role=UserRole.DOCTOR.value,
            message_text=f"📋 Digital Prescription Issued (#{rx_past.prescription_number})\nDiagnosis: Atopic Dermatitis Flare-up\nPlease download the signed PDF prescription.",
            message_type="PRESCRIPTION",
            attachment_url=f"/api/prescriptions/{rx_past.id}/download",
            attachment_name=f"{rx_past.prescription_number}.pdf",
            created_at=datetime.combine(yesterday, datetime.strptime("10:30", "%H:%M").time())
        )
        db.add(msg_rx)

        # Today's Confirmed Appointment for Aarav Sharma (Priya Sharma)
        appt_today = Appointment(
            appointment_number="APT-20261105-AAR02",
            child_id=child1.id,
            parent_id=parent1.id,
            doctor_id=doctor_profile.id,
            appointment_date=today,
            start_time="11:30",
            end_time="12:00",
            status=AppointmentStatus.CONFIRMED.value,
            reason="Night-time dry barking cough for past 3 days and throat irritation after kindergarten.",
            consultation_room_id="CareConnect-Pediatrics-AAR-002"
        )
        db.add(appt_today)
        db.flush()

        consult_today = Consultation(
            appointment_id=appt_today.id,
            doctor_notes="",
            diagnosis=""
        )
        db.add(consult_today)

        conv_today = Conversation(
            appointment_id=appt_today.id,
            parent_id=parent1.id,
            doctor_id=doctor_profile.id,
            child_id=child1.id
        )
        db.add(conv_today)
        db.flush()

        msg_today1 = Message(
            conversation_id=conv_today.id,
            sender_id=parent1.id,
            sender_role=UserRole.PARENT.value,
            message_text="Namaste Dr. Sharma, Aarav has had an annoying dry cough especially around 2 AM.",
            created_at=datetime.combine(today, datetime.strptime("09:15", "%H:%M").time())
        )
        msg_today2 = Message(
            conversation_id=conv_today.id,
            sender_id=doctor_user.id,
            sender_role=UserRole.DOCTOR.value,
            message_text="Namaste Priya ji. We will check his chest sound, throat, and breathing rate in our 11:30 AM video call.",
            created_at=datetime.combine(today, datetime.strptime("09:25", "%H:%M").time())
        )
        db.add_all([msg_today1, msg_today2])

        # Notifications
        notif1 = Notification(
            user_id=parent1.id,
            title="Consultation Today at 11:30 AM",
            message=f"Reminder: You have a scheduled online consultation for Aarav Sharma with Dr. Rajesh Sharma at 11:30 AM.",
            notification_type="APPOINTMENT",
            related_entity_id=str(appt_today.id)
        )
        notif2 = Notification(
            user_id=doctor_user.id,
            title="Upcoming Appointment Today",
            message=f"Aarav Sharma (3 yrs) consultation scheduled for 11:30 AM.",
            notification_type="APPOINTMENT",
            related_entity_id=str(appt_today.id)
        )
        db.add_all([notif1, notif2])

        # Sample Medical Record for Aarav Sharma
        dummy_rec_path = os.path.join(settings.MEDICAL_RECORDS_UPLOAD_DIR, "aarav_vaccination_card.pdf")
        with open(dummy_rec_path, "w") as f:
            f.write("%PDF-1.4 Mock Pediatric Vaccination Record for Aarav Sharma - CareConnect Demo")
        
        med_rec = MedicalRecord(
            child_id=child1.id,
            uploaded_by_user_id=parent1.id,
            title="Official Pediatric Immunization Record Card",
            record_type="VACCINATION",
            file_path=dummy_rec_path,
            file_name="aarav_vaccination_card.pdf",
            file_size_bytes=len("%PDF-1.4 Mock Pediatric Vaccination Record for Aarav Sharma - CareConnect Demo"),
            mime_type="application/pdf",
            notes="Immunization record card showing BCG, OPV, Pentavalent, Rotavirus, and MMR vaccinations."
        )
        db.add(med_rec)

        db.commit()
        print("\n========================================================")
        print("CareConnect Database Successfully Seeded!")
        print("========================================================")
        print("Development Demo Credentials:")
        print("1. Administrator:")
        print("   Email:    admin@careconnect.com")
        print("   Password: Admin@123")
        print("2. Verified Pediatrician:")
        print("   Email:    dr.sharma@careconnect.com")
        print("   Password: Doctor@123")
        print("3. Parent 1 (Priya Sharma - Aarav & Ananya):")
        print("   Email:    priya.sharma@gmail.com")
        print("   Password: Parent@123")
        print("4. Parent 2 (Vikram Mehta - Vivaan):")
        print("   Email:    vikram.mehta@gmail.com")
        print("   Password: Parent@123")
        print("========================================================\n")

    except Exception as e:
        print(f"Error seeding database: {e}")
        db.rollback()
        raise e
    finally:
        db.close()

if __name__ == "__main__":
    seed_database()
