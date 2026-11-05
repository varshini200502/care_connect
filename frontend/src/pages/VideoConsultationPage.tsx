import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Video,
  FileText,
  User,
  AlertTriangle,
  History,
  ShieldCheck,
  ArrowLeft,
  MessageSquare,
  Clock,
  CheckCircle2
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { appointmentsApi } from '../services/api';
import { Appointment } from '../types';
import { JitsiVideoCall } from '../components/JitsiVideoCall';
import { PrescriptionModal } from '../components/PrescriptionModal';

export const VideoConsultationPage: React.FC = () => {
  const { appointmentId } = useParams<{ appointmentId: string }>();
  const { user, isDoctor } = useAuth();
  const navigate = useNavigate();

  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Prescription Modal
  const [rxModalOpen, setRxModalOpen] = useState(false);

  useEffect(() => {
    if (!appointmentId) return;
    const fetchAppt = async () => {
      try {
        setLoading(true);
        const data = await appointmentsApi.getById(Number(appointmentId));
        setAppointment(data);
      } catch (err: any) {
        setError(err.response?.data?.detail || 'Unauthorized or appointment not found.');
      } finally {
        setLoading(false);
      }
    };
    fetchAppt();
  }, [appointmentId]);

  const calculateAge = (dobString: string) => {
    const dob = new Date(dobString);
    const today = new Date();
    let years = today.getFullYear() - dob.getFullYear();
    const m = today.getMonth() - dob.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) {
      years--;
    }
    if (years >= 2) return `${years} yrs`;
    const months = (today.getFullYear() - dob.getFullYear()) * 12 + today.getMonth() - dob.getMonth();
    return `${Math.max(1, months)} mos`;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm font-semibold text-slate-300">Connecting to secure video consultation room...</p>
        </div>
      </div>
    );
  }

  if (error || !appointment) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
        <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-xl max-w-md text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-slate-900">Access Restricted</h2>
          <p className="text-xs text-slate-500">{error || 'You cannot join this consultation.'}</p>
          <Link
            to={isDoctor ? '/dashboard/doctor' : '/dashboard/parent'}
            className="inline-block px-5 py-2.5 bg-primary-600 text-white font-bold text-xs rounded-xl shadow-md"
          >
            Return to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Navigation Bar */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate(isDoctor ? '/dashboard/doctor' : '/dashboard/parent')}
            className="text-xs font-semibold text-slate-400 hover:text-white flex items-center gap-1.5 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Dashboard
          </button>

          <div className="flex items-center gap-2">
            <span className="text-xs font-mono bg-slate-800 text-slate-300 px-3 py-1 rounded-full border border-slate-700">
              #{appointment.appointment_number}
            </span>
            <Link
              to="/chat"
              className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-xs font-semibold rounded-full border border-slate-700 flex items-center gap-1.5 transition-colors"
            >
              <MessageSquare className="w-3.5 h-3.5" /> Consultation Chat
            </Link>
          </div>
        </div>

        {/* Main Grid: Video Room + Clinical Sidebar */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Video Container (8 Cols) */}
          <div className="lg:col-span-8">
            <JitsiVideoCall
              appointment={appointment}
              onOpenPrescriptionModal={() => setRxModalOpen(true)}
              onEndCall={() => {
                navigate(isDoctor ? '/dashboard/doctor' : '/dashboard/parent');
              }}
            />
          </div>

          {/* Clinical Patient Summary Sidebar (4 Cols) */}
          <div className="lg:col-span-4 bg-slate-800/80 rounded-3xl p-6 border border-slate-700 shadow-xl space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-700">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-primary-600 text-white font-black text-sm flex items-center justify-center">
                  {appointment.child.full_name.charAt(0)}
                </div>
                <div>
                  <h3 className="font-bold text-sm text-white">{appointment.child.full_name}</h3>
                  <p className="text-[11px] text-slate-400">
                    {calculateAge(appointment.child.date_of_birth)} old • {appointment.child.gender}
                  </p>
                </div>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-700 text-slate-300">
                Blood: {appointment.child.blood_group || 'N/A'}
              </span>
            </div>

            {/* Allergies Alert */}
            {appointment.child.allergies ? (
              <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs space-y-1">
                <div className="flex items-center gap-1.5 font-bold uppercase tracking-wider text-[10px] text-rose-400">
                  <AlertTriangle className="w-3.5 h-3.5" /> Critical Allergies
                </div>
                <p className="font-semibold text-white text-xs">{appointment.child.allergies}</p>
              </div>
            ) : (
              <div className="p-3 rounded-2xl bg-slate-700/40 text-slate-400 text-xs">
                No known drug allergies reported.
              </div>
            )}

            {/* Chief Complaint */}
            <div className="space-y-1.5 text-xs">
              <span className="font-bold text-slate-300 uppercase tracking-wider text-[10px]">
                Reason for Consultation
              </span>
              <p className="p-3 rounded-2xl bg-slate-900/60 border border-slate-700/80 text-slate-200 leading-relaxed">
                {appointment.reason}
              </p>
            </div>

            {/* Existing Medical Conditions & History */}
            {appointment.child.existing_conditions && (
              <div className="space-y-1 text-xs">
                <span className="font-bold text-slate-400 uppercase tracking-wider text-[10px]">
                  Existing Conditions
                </span>
                <p className="text-slate-300 text-xs">{appointment.child.existing_conditions}</p>
              </div>
            )}

            {/* Actions for Doctor */}
            {isDoctor && (
              <div className="pt-3 border-t border-slate-700 space-y-2">
                <button
                  onClick={() => setRxModalOpen(true)}
                  className="w-full py-2.5 bg-primary-600 hover:bg-primary-500 text-white font-bold text-xs rounded-xl shadow-md flex items-center justify-center gap-2 transition-colors"
                >
                  <FileText className="w-4 h-4" /> Issue Digital Prescription
                </button>
                <Link
                  to={`/child/${appointment.child.id}/history`}
                  target="_blank"
                  className="w-full py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 font-semibold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-colors"
                >
                  <History className="w-4 h-4" /> Full Medical History Timeline
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Prescription Modal */}
      {rxModalOpen && appointment && (
        <PrescriptionModal
          appointment={appointment}
          isOpen={rxModalOpen}
          onClose={() => setRxModalOpen(false)}
        />
      )}
    </div>
  );
};
