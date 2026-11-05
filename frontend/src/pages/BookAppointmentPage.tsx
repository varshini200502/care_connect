import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Calendar as CalendarIcon,
  Clock,
  User,
  Heart,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ShieldCheck,
  Stethoscope,
  Info
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { childrenApi, doctorsApi, appointmentsApi } from '../services/api';
import { Child, Doctor, Slot } from '../types';

export const BookAppointmentPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [children, setChildren] = useState<Child[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [selectedChildId, setSelectedChildId] = useState<number | null>(null);
  const [selectedDoctorId, setSelectedDoctorId] = useState<number | null>(null);

  // Tomorrow by default
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().split('T')[0];

  const [selectedDate, setSelectedDate] = useState<string>(tomorrowStr);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);
  const [reason, setReason] = useState('');
  const [guardianConsent, setGuardianConsent] = useState(true);

  const [loadingSlots, setLoadingSlots] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successAppt, setSuccessAppt] = useState<any | null>(null);

  // Initial load
  useEffect(() => {
    const init = async () => {
      try {
        const [kids, docs] = await Promise.all([
          childrenApi.list(),
          doctorsApi.listVerified(),
        ]);
        setChildren(kids);
        setDoctors(docs);

        // Pre-select child from query param or first child
        const paramChildId = searchParams.get('childId');
        if (paramChildId && kids.some((k) => k.id === Number(paramChildId))) {
          setSelectedChildId(Number(paramChildId));
        } else if (kids.length > 0) {
          setSelectedChildId(kids[0].id);
        }

        // Pre-select doctor
        if (docs.length > 0) {
          setSelectedDoctorId(docs[0].id);
        }
      } catch (e) {
        console.error('Failed to initialize booking:', e);
      }
    };
    init();
  }, [searchParams]);

  // Fetch real-time available slots whenever doctor or date changes
  useEffect(() => {
    if (!selectedDoctorId || !selectedDate) return;
    const fetchSlots = async () => {
      setLoadingSlots(true);
      setError(null);
      setSelectedSlot(null);
      try {
        const availableSlots = await doctorsApi.getSlots(selectedDoctorId, selectedDate);
        setSlots(availableSlots);
      } catch (e: any) {
        console.error('Error fetching slots:', e);
        setError('Failed to compute available time slots. Please try another date.');
      } finally {
        setLoadingSlots(false);
      }
    };
    fetchSlots();
  }, [selectedDoctorId, selectedDate]);

  const handleBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!selectedChildId) {
      setError('Please select or register a child profile.');
      return;
    }
    if (!selectedDoctorId) {
      setError('Please select a pediatrician.');
      return;
    }
    if (!selectedSlot) {
      setError('Please select an available consultation time slot.');
      return;
    }
    if (!reason.trim()) {
      setError('Please describe the child’s symptoms or reason for consultation.');
      return;
    }
    if (!guardianConsent) {
      setError('Guardian consent is required to confirm the telemedicine appointment.');
      return;
    }

    setSubmitting(true);
    try {
      const appt = await appointmentsApi.create({
        child_id: selectedChildId,
        doctor_id: selectedDoctorId,
        appointment_date: selectedDate,
        start_time: selectedSlot.start_time,
        end_time: selectedSlot.end_time,
        reason: reason.trim(),
      });
      setSuccessAppt(appt);
    } catch (err: any) {
      // Catch double-booking conflict
      if (err.response?.status === 409) {
        setError('Double-booking conflict: This time slot was just taken by another parent. Please choose another slot.');
        // Refresh slots
        if (selectedDoctorId) {
          doctorsApi.getSlots(selectedDoctorId, selectedDate).then(setSlots);
        }
      } else {
        setError(err.response?.data?.detail || 'Failed to complete appointment booking.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const selectedDoctor = doctors.find((d) => d.id === selectedDoctorId);
  const selectedChild = children.find((c) => c.id === selectedChildId);

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-2">
          <span className="px-3.5 py-1 rounded-full text-xs font-bold bg-primary-100 text-primary-700 uppercase tracking-wider">
            Online Pediatric Consultation
          </span>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            Schedule an Appointment
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 max-w-lg mx-auto">
            Select your child, choose your preferred consultation date & time, and connect directly with our specialist pediatrician.
          </p>
        </div>

        {/* Success Confirmation Card */}
        {successAppt ? (
          <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-xl text-center space-y-6 animate-in fade-in">
            <div className="w-16 h-16 bg-mint-100 text-mint-600 rounded-full flex items-center justify-center mx-auto shadow-sm">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <div className="space-y-1">
              <span className="text-xs font-mono font-bold text-mint-700 bg-mint-50 px-3 py-1 rounded-full border border-mint-200">
                Confirmed: #{successAppt.appointment_number}
              </span>
              <h2 className="text-2xl font-extrabold text-slate-900 pt-2">
                Appointment Booked Successfully!
              </h2>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Your online video consultation for <b className="text-slate-800">{successAppt.child.full_name}</b> has been scheduled with Dr. Rajesh Sharma.
              </p>
            </div>

            <div className="max-w-md mx-auto p-4 rounded-2xl bg-slate-50 border border-slate-200/80 text-left space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Consultation Date:</span>
                <span className="font-bold text-slate-800">{successAppt.appointment_date}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Scheduled Time Slot:</span>
                <span className="font-bold text-slate-800">{successAppt.start_time} - {successAppt.end_time}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Specialist:</span>
                <span className="font-bold text-slate-800">Dr. Rajesh Sharma (MD Pediatrics)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Reason:</span>
                <span className="font-medium text-slate-700 max-w-[200px] truncate">{successAppt.reason}</span>
              </div>
            </div>

            <div className="flex flex-wrap justify-center gap-3 pt-2">
              <button
                onClick={() => navigate('/dashboard/parent')}
                className="px-6 py-2.5 bg-primary-600 text-white font-bold text-xs rounded-xl shadow-md hover:bg-primary-700"
              >
                Go to Parent Dashboard
              </button>
              <button
                onClick={() => navigate(`/consultation/${successAppt.id}`)}
                className="px-6 py-2.5 bg-mint-600 text-white font-bold text-xs rounded-xl shadow-md hover:bg-mint-700"
              >
                Preview Video Call Room
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleBooking} className="bg-white rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-100 space-y-8">
            {error && (
              <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-2">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Step 1: Select Child Profile */}
            <div className="space-y-3">
              <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider">
                Step 1: Select Child *
              </label>

              {children.length === 0 ? (
                <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-800 flex items-center justify-between">
                  <span>No child profile found. Please register your child first.</span>
                  <button
                    type="button"
                    onClick={() => navigate('/dashboard/parent')}
                    className="font-bold underline text-amber-900"
                  >
                    Add Child
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {children.map((child) => (
                    <div
                      key={child.id}
                      onClick={() => setSelectedChildId(child.id)}
                      className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                        selectedChildId === child.id
                          ? 'border-primary-600 bg-primary-50/50 shadow-sm ring-1 ring-primary-600'
                          : 'border-slate-200 hover:border-slate-300 bg-white'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-primary-100 text-primary-700 font-bold text-xs flex items-center justify-center">
                          {child.full_name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-bold text-xs text-slate-900 leading-tight">{child.full_name}</p>
                          <p className="text-[10px] text-slate-500">{child.blood_group || 'Blood N/A'} • {child.gender || 'Child'}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Step 2: Pediatrician Spotlight */}
            <div className="space-y-3">
              <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider">
                Step 2: Pediatrician Specialist
              </label>

              {selectedDoctor && (
                <div className="p-4 rounded-2xl bg-gradient-to-r from-slate-50 to-primary-50/40 border border-slate-200 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-2xl bg-primary-600 text-white font-extrabold text-sm flex items-center justify-center">
                      RS
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-slate-900">Dr. Rajesh Sharma</h4>
                      <p className="text-xs text-slate-500">MD Pediatrics (AIIMS New Delhi) • 12+ Yrs Exp</p>
                      <p className="text-[10px] text-mint-600 font-bold mt-0.5">Verified NMC License: MCI-88421</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-slate-400">Consultation Fee</span>
                    <p className="font-extrabold text-sm text-slate-900">₹600</p>
                  </div>
                </div>
              )}
            </div>

            {/* Step 3: Date & Real-time Slots */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Step 3: Choose Date & Available Slot *
                </label>
                <div className="text-xs text-slate-500 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-primary-500" /> 30-Minute Consultation
                </div>
              </div>

              {/* Date Input */}
              <div className="max-w-xs">
                <input
                  type="date"
                  min={new Date().toISOString().split('T')[0]}
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-full px-4 py-2.5 text-xs font-bold rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary-500 bg-white"
                />
              </div>

              {/* Slot Selector Grid */}
              <div>
                <p className="text-xs font-semibold text-slate-600 mb-2">
                  Available Slots for {selectedDate}:
                </p>

                {loadingSlots ? (
                  <div className="py-8 text-center text-xs text-slate-400">
                    <div className="w-6 h-6 border-2 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                    Checking doctor availability & removing conflicts...
                  </div>
                ) : slots.length === 0 ? (
                  <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-800">
                    Dr. Sharma is not available on this date or all slots are fully booked. Please select another date.
                  </div>
                ) : (
                  <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                    {slots.map((slot, idx) => (
                      <button
                        key={idx}
                        type="button"
                        disabled={!slot.is_available}
                        onClick={() => setSelectedSlot(slot)}
                        className={`py-2 px-1 text-center rounded-xl text-xs font-bold transition-all ${
                          !slot.is_available
                            ? 'bg-slate-100 text-slate-300 border border-slate-200/50 cursor-not-allowed line-through'
                            : selectedSlot?.start_time === slot.start_time
                            ? 'bg-primary-600 text-white shadow-md shadow-primary-600/25 scale-105'
                            : 'bg-white text-slate-700 border border-slate-200 hover:border-primary-500 hover:bg-primary-50/50'
                        }`}
                      >
                        {slot.start_time}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Step 4: Consultation Reason */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider">
                Step 4: Chief Medical Complaint / Reason *
              </label>
              <textarea
                rows={3}
                required
                placeholder="Describe your child's current symptoms, duration, temperature, or any specific health queries for Dr. Sharma..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full px-4 py-3 text-xs rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>

            {/* Guardian Consent */}
            <div>
              <label className="flex items-start gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={guardianConsent}
                  onChange={(e) => setGuardianConsent(e.target.checked)}
                  className="mt-0.5 rounded border-slate-300 text-primary-600 focus:ring-primary-500"
                />
                <span className="text-xs text-slate-600 leading-snug">
                  I give consent for online pediatric consultation under the Telemedicine Practice Guidelines. I understand that this is for non-emergency clinical evaluation.
                </span>
              </label>
            </div>

            {/* Submit CTA */}
            <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
              <button
                type="button"
                onClick={() => navigate('/dashboard/parent')}
                className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-800"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting || !selectedSlot}
                className="px-8 py-3 bg-primary-600 hover:bg-primary-700 text-white font-bold text-sm rounded-xl shadow-lg shadow-primary-600/25 disabled:opacity-50 flex items-center gap-2 transition-transform hover:scale-[1.02]"
              >
                {submitting ? 'Confirming Booking...' : 'Confirm & Schedule Appointment'}
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
