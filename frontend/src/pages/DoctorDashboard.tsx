import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Stethoscope,
  Calendar,
  Clock,
  Video,
  FileText,
  Users,
  CheckCircle2,
  AlertCircle,
  MessageSquare,
  History,
  TrendingUp,
  Settings,
  ShieldCheck,
  Award
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { appointmentsApi, prescriptionsApi } from '../services/api';
import { Appointment, Prescription } from '../types';
import { PrescriptionModal } from '../components/PrescriptionModal';

export const DoctorDashboard: React.FC = () => {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

  // Prescription Modal State
  const [rxModalOpen, setRxModalOpen] = useState(false);
  const [selectedApptForRx, setSelectedApptForRx] = useState<Appointment | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const appts = await appointmentsApi.list();
      setAppointments(appts);
    } catch (e) {
      console.error('Failed to load doctor dashboard:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const todayStr = new Date().toISOString().split('T')[0];
  const todayAppointments = appointments.filter((a) => a.appointment_date === todayStr);
  const upcomingAppointments = appointments.filter(
    (a) => a.appointment_date > todayStr && a.status !== 'CANCELLED'
  );
  const completedAppointments = appointments.filter((a) => a.status === 'COMPLETED');

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

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Doctor Header Banner */}
        <div className="bg-gradient-to-r from-slate-900 via-primary-950 to-mint-950 rounded-3xl p-6 sm:p-8 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6 border border-slate-800">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-mint-500 to-primary-600 flex items-center justify-center text-white font-black text-2xl shadow-lg">
              {user?.full_name?.replace('Dr. ', '').charAt(0) || 'D'}
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-mint-500/20 text-mint-400 border border-mint-500/30 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" /> Verified Pediatric Specialist
                </span>
                <span className="text-xs text-slate-400">NMC Reg: MCI-DMR-2014-88421</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                {user?.full_name}
              </h1>
              <p className="text-xs text-slate-300">
                MBBS, MD (Pediatrics, AIIMS) • Senior Pediatrician Consultant
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Link
              to="/doctor/availability"
              className="px-5 py-3 rounded-2xl bg-white/10 hover:bg-white/20 backdrop-blur-md text-white font-semibold text-xs sm:text-sm border border-white/20 flex items-center gap-2 transition-colors"
            >
              <Clock className="w-4 h-4 text-mint-400" /> Manage Available Slots
            </Link>
            <Link
              to="/chat"
              className="px-5 py-3 rounded-2xl bg-primary-600 hover:bg-primary-500 text-white font-bold text-xs sm:text-sm shadow-lg shadow-primary-600/30 flex items-center gap-2 transition-transform hover:scale-105 active:scale-95"
            >
              <MessageSquare className="w-4 h-4" /> Patient Inquiries
            </Link>
          </div>
        </div>

        {/* Metric Overview Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm space-y-1">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Today's Patients</span>
            <p className="text-3xl font-extrabold text-slate-900">{todayAppointments.length}</p>
            <p className="text-[11px] text-primary-600 font-medium">Scheduled for today</p>
          </div>

          <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm space-y-1">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Completed Calls</span>
            <p className="text-3xl font-extrabold text-mint-600">{completedAppointments.length}</p>
            <p className="text-[11px] text-slate-400">Total sessions delivered</p>
          </div>

          <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm space-y-1">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Upcoming Bookings</span>
            <p className="text-3xl font-extrabold text-primary-600">{upcomingAppointments.length}</p>
            <p className="text-[11px] text-slate-400">Future scheduled slots</p>
          </div>

          <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm space-y-1">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Patient Rating</span>
            <p className="text-3xl font-extrabold text-amber-500 flex items-center gap-1">
              4.95 <Award className="w-5 h-5 fill-amber-400" />
            </p>
            <p className="text-[11px] text-slate-400">Parent satisfaction score</p>
          </div>
        </div>

        {/* Section 1: Today's Consultations Queue */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-primary-600" />
              <h2 className="text-lg font-bold text-slate-900">Today's Consultation Schedule</h2>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-primary-100 text-primary-800">
                {new Date().toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })}
              </span>
            </div>
          </div>

          {todayAppointments.length === 0 ? (
            <div className="p-8 text-center bg-white rounded-3xl border border-slate-100 text-slate-500 text-xs">
              No appointments scheduled for today yet. You can configure your available hours in the Consultation Hours tab.
            </div>
          ) : (
            <div className="space-y-3">
              {todayAppointments.map((appt) => (
                <div
                  key={appt.id}
                  className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm hover:shadow-md transition-shadow flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
                >
                  <div className="flex items-start gap-4">
                    <div className="p-3 rounded-2xl bg-primary-50 text-primary-700 font-bold text-center min-w-[70px]">
                      <div className="text-xs uppercase text-primary-500 font-semibold">Slot</div>
                      <div className="text-sm font-extrabold">{appt.start_time}</div>
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-base text-slate-900">
                          {appt.child.full_name}
                        </h3>
                        <span className="text-xs px-2 py-0.5 bg-slate-100 text-slate-600 font-medium rounded-full">
                          {calculateAge(appt.child.date_of_birth)} old • {appt.child.gender}
                        </span>
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            appt.status === 'IN_PROGRESS'
                              ? 'bg-emerald-100 text-emerald-700 animate-pulse'
                              : appt.status === 'COMPLETED'
                              ? 'bg-slate-100 text-slate-600'
                              : 'bg-primary-100 text-primary-700'
                          }`}
                        >
                          {appt.status.replace('_', ' ')}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 mt-1">
                        <span className="font-semibold text-slate-700">Chief Complaint:</span> {appt.reason}
                      </p>
                      <div className="flex items-center gap-4 text-[11px] text-slate-400 mt-1">
                        <span>Allergies: <b className="text-slate-600">{appt.child.allergies || 'None'}</b></span>
                        <span>Blood: <b className="text-slate-600">{appt.child.blood_group || 'Unknown'}</b></span>
                      </div>
                    </div>
                  </div>

                  {/* Doctor Action Buttons */}
                  <div className="flex items-center gap-2 self-end md:self-center">
                    <Link
                      to={`/consultation/${appt.id}`}
                      className="px-4 py-2 bg-mint-600 hover:bg-mint-700 text-white font-bold text-xs rounded-xl shadow-md shadow-mint-600/20 flex items-center gap-1.5 transition-transform hover:scale-105"
                    >
                      <Video className="w-3.5 h-3.5" /> Start Video Call
                    </Link>

                    <button
                      onClick={() => {
                        setSelectedApptForRx(appt);
                        setRxModalOpen(true);
                      }}
                      className="px-3.5 py-2 bg-primary-50 hover:bg-primary-100 text-primary-700 font-bold text-xs rounded-xl flex items-center gap-1.5 transition-colors"
                    >
                      <FileText className="w-3.5 h-3.5" /> Issue Rx
                    </button>

                    <Link
                      to={`/child/${appt.child.id}/history`}
                      className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl"
                      title="Medical History"
                    >
                      <History className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Section 2: All Upcoming & Historical Appointments Table */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-primary-600" />
              <h2 className="text-lg font-bold text-slate-900">All Scheduled Consultations</h2>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-200 text-slate-700">
                {appointments.length}
              </span>
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-100">
                  <tr>
                    <th className="px-6 py-3.5">Appointment #</th>
                    <th className="px-6 py-3.5">Child Name</th>
                    <th className="px-6 py-3.5">Date & Slot</th>
                    <th className="px-6 py-3.5">Reason</th>
                    <th className="px-6 py-3.5">Status</th>
                    <th className="px-6 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {appointments.map((appt) => (
                    <tr key={appt.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-6 py-4 font-mono font-medium text-slate-500">{appt.appointment_number}</td>
                      <td className="px-6 py-4">
                        <div className="font-bold text-slate-900">{appt.child.full_name}</div>
                        <div className="text-[11px] text-slate-400">{calculateAge(appt.child.date_of_birth)} old</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-medium text-slate-800">{appt.appointment_date}</div>
                        <div className="text-[11px] text-slate-400">{appt.start_time} - {appt.end_time}</div>
                      </td>
                      <td className="px-6 py-4 max-w-xs truncate">{appt.reason}</td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                            appt.status === 'COMPLETED'
                              ? 'bg-slate-100 text-slate-700'
                              : appt.status === 'CANCELLED'
                              ? 'bg-rose-100 text-rose-700'
                              : 'bg-emerald-100 text-emerald-700'
                          }`}
                        >
                          {appt.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right space-x-2">
                        <Link
                          to={`/consultation/${appt.id}`}
                          className="px-2.5 py-1 bg-mint-50 text-mint-700 font-bold rounded-lg hover:bg-mint-100 inline-block"
                        >
                          Video
                        </Link>
                        <button
                          onClick={() => {
                            setSelectedApptForRx(appt);
                            setRxModalOpen(true);
                          }}
                          className="px-2.5 py-1 bg-primary-50 text-primary-700 font-bold rounded-lg hover:bg-primary-100 inline-block"
                        >
                          Rx
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Prescription Creation Modal */}
      {rxModalOpen && selectedApptForRx && (
        <PrescriptionModal
          appointment={selectedApptForRx}
          isOpen={rxModalOpen}
          onClose={() => {
            setRxModalOpen(false);
            setSelectedApptForRx(null);
          }}
          onSuccess={() => {
            loadData();
          }}
        />
      )}
    </div>
  );
};
