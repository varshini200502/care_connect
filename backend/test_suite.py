import os
import sys
import unittest
from datetime import date, timedelta
from fastapi.testclient import TestClient

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.main import app
from app.core.database import SessionLocal
from app.models.models import User, Child, Appointment, Prescription

client = TestClient(app)

class TestCareConnectPlatform(unittest.TestCase):

    def test_01_root_health(self):
        res = client.get("/")
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertEqual(data["status"], "online")
        print("[PASS] Root Health check passed")

    def test_02_login_and_roles(self):
        # 1. Admin login
        res = client.post("/api/auth/login", json={"email": "admin@careconnect.com", "password": "Admin@123"})
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.json()["user"]["role"], "ADMIN")
        
        # 2. Doctor login
        res = client.post("/api/auth/login", json={"email": "dr.sharma@careconnect.com", "password": "Doctor@123"})
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.json()["user"]["role"], "DOCTOR")
        
        # 3. Parent login
        res = client.post("/api/auth/login", json={"email": "priya.sharma@gmail.com", "password": "Parent@123"})
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.json()["user"]["role"], "PARENT")
        print("[PASS] Authentication & Role-based tokens passed")

    def test_03_parent_child_crud_and_isolation(self):
        # Login as Parent 1
        p1_res = client.post("/api/auth/login", json={"email": "priya.sharma@gmail.com", "password": "Parent@123"})
        p1_token = p1_res.json()["access_token"]
        headers1 = {"Authorization": f"Bearer {p1_token}"}

        # Login as Parent 2
        p2_res = client.post("/api/auth/login", json={"email": "vikram.mehta@gmail.com", "password": "Parent@123"})
        p2_token = p2_res.json()["access_token"]
        headers2 = {"Authorization": f"Bearer {p2_token}"}

        # Parent 1 adds new child
        new_child = {
            "full_name": "Rohan Sharma",
            "date_of_birth": "2022-06-15",
            "gender": "Male",
            "blood_group": "B+",
            "allergies": "Dust mite",
            "existing_conditions": "None",
            "medical_history": "Full term normal delivery"
        }
        res = client.post("/api/children/", json=new_child, headers=headers1)
        self.assertEqual(res.status_code, 201)
        rohan_id = res.json()["id"]

        # Parent 1 can view
        res = client.get(f"/api/children/{rohan_id}", headers=headers1)
        self.assertEqual(res.status_code, 200)

        # SECURITY TEST: Parent 2 CANNOT access Parent 1's child!
        res = client.get(f"/api/children/{rohan_id}", headers=headers2)
        self.assertEqual(res.status_code, 403)
        print("[PASS] Parent-Child CRUD & Cross-parent security isolation passed")

    def test_04_doctor_slots_and_booking_integrity(self):
        # Login Doctor to get doctor ID
        doc_res = client.post("/api/auth/login", json={"email": "dr.sharma@careconnect.com", "password": "Doctor@123"})
        doc_id = doc_res.json()["user"]["doctor_profile"]["id"]

        # Login Parent 1
        p1_res = client.post("/api/auth/login", json={"email": "priya.sharma@gmail.com", "password": "Parent@123"})
        p1_token = p1_res.json()["access_token"]
        headers1 = {"Authorization": f"Bearer {p1_token}"}

        # Get Parent 1's children
        children_res = client.get("/api/children/", headers=headers1)
        child_id = children_res.json()[0]["id"]

        # Check available slots for tomorrow
        target_date = (date.today() + timedelta(days=2)).isoformat()
        slots_res = client.get(f"/api/doctors/{doc_id}/slots?date={target_date}")
        self.assertEqual(slots_res.status_code, 200)
        slots = slots_res.json()
        self.assertTrue(len(slots) > 0)
        slot_to_book = slots[0]

        # Book the slot
        booking_payload = {
            "child_id": child_id,
            "doctor_id": doc_id,
            "appointment_date": target_date,
            "start_time": slot_to_book["start_time"],
            "end_time": slot_to_book["end_time"],
            "reason": "Routine growth checkup and developmental screening."
        }
        b_res = client.post("/api/appointments/", json=booking_payload, headers=headers1)
        self.assertEqual(b_res.status_code, 201)
        appt_data = b_res.json()
        self.assertEqual(appt_data["status"], "CONFIRMED")
        self.assertTrue("CareConnect-Pediatrics-" in appt_data["consultation_room_id"])

        # DOUBLE-BOOKING PREVENTION TEST:
        # Attempting to book the EXACT SAME SLOT must return 409 Conflict!
        dup_res = client.post("/api/appointments/", json=booking_payload, headers=headers1)
        self.assertEqual(dup_res.status_code, 409)
        print("[PASS] Appointment booking & Double-booking prevention rule verified (HTTP 409 Conflict)")

    def test_05_prescription_creation_and_pdf(self):
        # Login Doctor
        doc_res = client.post("/api/auth/login", json={"email": "dr.sharma@careconnect.com", "password": "Doctor@123"})
        doc_token = doc_res.json()["access_token"]
        doc_headers = {"Authorization": f"Bearer {doc_token}"}

        # Login Parent 1 to check existing appointment
        p1_res = client.post("/api/auth/login", json={"email": "priya.sharma@gmail.com", "password": "Parent@123"})
        p1_token = p1_res.json()["access_token"]
        p1_headers = {"Authorization": f"Bearer {p1_token}"}

        appts = client.get("/api/appointments/", headers=p1_headers).json()
        active_appt = [a for a in appts if a["status"] in ["CONFIRMED", "IN_PROGRESS"]][0]

        # Doctor creates prescription
        rx_payload = {
            "appointment_id": active_appt["id"],
            "diagnosis": "Acute Allergic Bronchitis - mild episodic",
            "additional_advice": "Steam inhalation once daily. Avoid chilled drinks.",
            "follow_up_date": (date.today() + timedelta(days=5)).isoformat(),
            "items": [
                {
                    "medicine_name": "Levocetirizine + Montelukast Syrup",
                    "dosage": "5 ml",
                    "frequency": "Once daily at night",
                    "duration": "7 Days",
                    "instructions": "Give after dinner"
                },
                {
                    "medicine_name": "Salbutamol Inhaler (100mcg) with Baby Spacer",
                    "dosage": "2 Puffs",
                    "frequency": "As needed (SOS)",
                    "duration": "5 Days",
                    "instructions": "Use spacer mask tightly over mouth and nose"
                }
            ]
        }

        # SECURITY CHECK: Parent cannot create prescription!
        fail_res = client.post("/api/prescriptions/", json=rx_payload, headers=p1_headers)
        self.assertEqual(fail_res.status_code, 403)

        # Doctor creates prescription
        rx_res = client.post("/api/prescriptions/", json=rx_payload, headers=doc_headers)
        self.assertEqual(rx_res.status_code, 201)
        rx_data = rx_res.json()
        self.assertTrue(rx_data["prescription_number"].startswith("RX-"))

        # Parent can download the generated PDF
        pdf_res = client.get(f"/api/prescriptions/{rx_data['id']}/download", headers=p1_headers)
        self.assertEqual(pdf_res.status_code, 200)
        self.assertEqual(pdf_res.headers["content-type"], "application/pdf")
        self.assertTrue(len(pdf_res.content) > 1000)
        print("[PASS] Digital Prescription & ReportLab PDF download verified")

    def test_06_admin_management_and_stats(self):
        admin_res = client.post("/api/auth/login", json={"email": "admin@careconnect.com", "password": "Admin@123"})
        admin_token = admin_res.json()["access_token"]
        admin_headers = {"Authorization": f"Bearer {admin_token}"}

        stats_res = client.get("/api/admin/stats", headers=admin_headers)
        self.assertEqual(stats_res.status_code, 200)
        stats = stats_res.json()
        self.assertTrue(stats["total_users"] >= 4)
        self.assertTrue(stats["total_appointments"] >= 2)
        print("[PASS] Admin Dashboard metrics and user auditing verified")

if __name__ == "__main__":
    unittest.main()
