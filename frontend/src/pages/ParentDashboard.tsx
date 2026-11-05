import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Users,
  Plus,
  Calendar,
  Clock,
  Video,
  FileText,
  Download,
  AlertTriangle,
  Heart,
  ChevronRight,
  ShieldCheck,
  Activity,
  History,
  MessageSquare,
  X
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { childrenApi, appointmentsApi, prescriptionsApi } from '../services/api';
import { Child, Appointment, Prescription } from '../types';

export const ParentDashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [children, setChildren] = useState<Child[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [loading, setLoading] = useState(true);

  // Add Child Modal State
  const [addChildOpen, setAddChildOpen] = useState(false);
  const [childForm, setChildForm] = useState({
    full_name: '',
    date_of_birth: '',
    gender: 'Male',
    blood_group: 'B+',
    allergies: '',
    existing_conditions: '',
    medical_history: '',
  });
  const [savingChild, setSavingChild] = useState(false);

  // Cancellation Modal State
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [selectedApptToCancel, setSelectedApptToCancel] = useState<Appointment | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelling, setCancelling] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const [kids, appts] = await Promise.all([
        childrenApi.list(),
        appointmentsApi.list(),
      ]);
      setChildren(kids);
      setAppointments(appts);

      // Collect prescriptions from all children
      if (kids.length > 0) {
        const rxPromises = kids.map((k) => prescriptionsApi.getByChild(k.id));
        const allRxArrays = await Promise.all(rxPromises);
        setPrescriptions(allRxArrays.flat().sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()));
      }
    } catch (e) {
      console.error('Error loading parent dashboard data:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateChild = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingChild(true);
    try {
      await childrenApi.create({
        full_name: childForm.full_name,
        date_of_birth: childForm.date_of_birth,
        gender: childForm.gender,
        blood_group: childForm.blood_group,
        allergies: childForm.allergies || undefined,
        existing_conditions: childForm.existing_conditions || undefined,
        medical_history: childForm.medical_history || undefined,
      });
      setAddChildOpen(false);
      setChildForm({
        full_name: '',
        date_of_birth: '',
        gender: 'Male',
        blood_group: 'B+',
        allergies: '',
        existing_conditions: '',
        medical_history: '',
      });
      loadData();
    } catch (e) {
      console.error('Failed to add child:', e);
    } finally {
      setSavingChild(false);
    }
  };

  const handleCancelAppointment = async () => {
    if (!selectedApptToCancel) return;
    setCancelling(true);
    try {
      await appointmentsApi.cancel(selectedApptToCancel.id, cancelReason || 'Parent requested cancellation');
      setCancelModalOpen(false);
      setSelectedApptToCancel(null);
      setCancelReason('');
      loadData();
    } catch (e) {
      console.error('Failed to cancel appointment:', e);
    } finally {
      setCancelling(false);
    }
  };

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

  const upcomingAppointments = appointments.filter(
    (a) => a.status === 'CONFIRMED' || a.status === 'IN_PROGRESS' || a.status === 'PENDING'
  );

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Welcome Header */}
        <div className="bg-gradient-to-r from-primary-600 via-primary-700 to-mint-600 rounded-3xl p-6 sm:p-8 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-white/20 backdrop-blur-md uppercase tracking-wider">
              Parent Portal
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Namaste, {user?.full_name}! 👋
            </h1>
            <p className="text-xs sm:text-sm text-white/80 max-w-xl">
              Manage your children's medical profiles, connect with Dr. Rajesh Sharma for scheduled video calls, and access your digital prescriptions.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Link
              to="/book-appointment"
              className="px-5 py-3 rounded-2xl bg-white text-primary-700 font-bold text-xs sm:text-sm shadow-md hover:bg-slate-50 flex items-center gap-2 transition-transform hover:scale-105 active:scale-95"
            >
              <Calendar className="w-4 h-4 text-primary-600" /> Book New Consultation
            </Link>
            <button
              onClick={() => setAddChildOpen(true)}
              className="px-4 py-3 rounded-2xl bg-white/20 hover:bg-white/30 backdrop-blur-md text-white font-semibold text-xs sm:text-sm flex items-center gap-1.5 transition-colors"
            >
              <Plus className="w-4 h-4" /> Add Child Profile
            </button>
          </div>
        </div>

        {/* Section 1: Children Profiles */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-primary-600" />
              <h2 className="text-lg font-bold text-slate-900">Registered Children</h2>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-200 text-slate-700">
                {children.length}
              </span>
            </div>
            <button
              onClick={() => setAddChildOpen(true)}
              className="text-xs font-bold text-primary-600 hover:text-primary-700 flex items-center gap-1 hover:underline"
            >
              <Plus className="w-3.5 h-3.5" /> Register Another Child
            </button>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {[1, 2].map((i) => (
                <div key={i} className="h-44 bg-white rounded-3xl animate-pulse border border-slate-100" />
              ))}
            </div>
          ) : children.length === 0 ? (
            <div className="p-8 text-center bg-white rounded-3xl border border-slate-100 shadow-sm space-y-3">
              <Users className="w-10 h-10 text-slate-300 mx-auto" />
              <p className="text-sm font-semibold text-slate-700">No children profiles registered yet</p>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Add your child's profile to enable seamless appointment scheduling and personalized digital prescriptions.
              </p>
              <button
                onClick={() => setAddChildOpen(true)}
                className="px-5 py-2.5 bg-primary-600 text-white text-xs font-bold rounded-xl shadow-md hover:bg-primary-700 inline-flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" /> Add First Child Profile
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {children.map((child) => (
                <div
                  key={child.id}
                  className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-primary-100 to-mint-100 text-primary-700 font-extrabold text-base flex items-center justify-center">
                          {child.full_name.charAt(0)}
                        </div>
                        <div>
                          <h3 className="font-bold text-sm text-slate-900 leading-tight">
                            {child.full_name}
                          </h3>
                          <p className="text-[11px] text-slate-500">
                            {calculateAge(child.date_of_birth)} old • {child.gender || 'Child'}
                          </p>
                        </div>
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                        Blood: {child.blood_group || 'N/A'}
                      </span>
                    </div>

                    {/* Allergies & Conditions pills */}
                    <div className="space-y-1.5 text-xs">
                      {child.allergies ? (
                        <div className="p-2 rounded-xl bg-amber-50 border border-amber-100 text-amber-800 text-[11px] flex items-start gap-1.5">
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-500 flex-shrink-0 mt-0.5" />
                          <span className="line-clamp-1"><b>Allergies:</b> {child.allergies}</span>
                        </div>
                      ) : (
                        <div className="p-2 rounded-xl bg-slate-50 text-slate-500 text-[11px]">
                          No known medical allergies
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                    <Link
                      to={`/child/${child.id}/history`}
                      className="font-bold text-primary-600 hover:text-primary-700 flex items-center gap-1 hover:underline"
                    >
                      <History className="w-3.5 h-3.5" /> Medical Timeline
                    </Link>
                    <Link
                      to={`/book-appointment?childId=${child.id}`}
                      className="px-3 py-1.5 bg-primary-50 text-primary-700 font-semibold rounded-lg hover:bg-primary-100 transition-colors"
                    >
                      Book Slot
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Section 2: Upcoming Appointments */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-primary-600" />
              <h2 className="text-lg font-bold text-slate-900">Scheduled Consultations</h2>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-200 text-slate-700">
                {upcomingAppointments.length}
              </span>
            </div>
          </div>

          {upcomingAppointments.length === 0 ? (
            <div className="p-6 text-center bg-white rounded-3xl border border-slate-100 text-slate-500 text-xs">
              No upcoming appointments. Need medical advice?{' '}
              <Link to="/book-appointment" className="font-bold text-primary-600 hover:underline">
                Book a consultation slot now.
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {upcomingAppointments.map((appt) => (
                <div
                  key={appt.id}
                  className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-4 flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">
                          #{appt.appointment_number}
                        </span>
                        <h3 className="font-bold text-base text-slate-900">
                          Consultation for {appt.child.full_name}
                        </h3>
                        <p className="text-xs text-slate-500 font-medium">
                          Dr. {appt.doctor.user?.full_name || 'Rajesh Sharma'} ({appt.doctor.specialization})
                        </p>
                      </div>
                      <span
                        className={`px-3 py-1 rounded-full text-[11px] font-bold ${
                          appt.status === 'IN_PROGRESS'
                            ? 'bg-emerald-100 text-emerald-700 animate-pulse'
                            : 'bg-primary-100 text-primary-700'
                        }`}
                      >
                        {appt.status.replace('_', ' ')}
                      </span>
                    </div>

                    <div className="p-3 bg-slate-50 rounded-2xl flex items-center justify-between text-xs text-slate-700">
                      <div className="flex items-center gap-1.5 font-medium">
                        <Calendar className="w-4 h-4 text-primary-500" />
                        {new Date(appt.appointment_date).toLocaleDateString('en-IN', {
                          weekday: 'short',
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </div>
                      <div className="flex items-center gap-1.5 font-bold text-slate-900">
                        <Clock className="w-4 h-4 text-primary-500" />
                        {appt.start_time} - {appt.end_time}
                      </div>
                    </div>

                    <div className="text-xs text-slate-600">
                      <span className="font-semibold text-slate-700">Reason:</span> {appt.reason}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Link
                        to={`/consultation/${appt.id}`}
                        className="px-4 py-2 bg-mint-600 hover:bg-mint-700 text-white font-bold text-xs rounded-xl shadow-md shadow-mint-600/20 flex items-center gap-1.5 transition-transform hover:scale-105"
                      >
                        <Video className="w-3.5 h-3.5" /> Join Video Call
                      </Link>
                      <Link
                        to="/chat"
                        className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl flex items-center gap-1.5 transition-colors"
                      >
                        <MessageSquare className="w-3.5 h-3.5" /> Chat
                      </Link>
                    </div>

                    <button
                      onClick={() => {
                        setSelectedApptToCancel(appt);
                        setCancelModalOpen(true);
                      }}
                      className="text-xs text-rose-600 hover:text-rose-700 font-medium hover:underline"
                    >
                      Cancel Appointment
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Section 3: Recent Digital Prescriptions */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-mint-600" />
              <h2 className="text-lg font-bold text-slate-900">Recent Digital Prescriptions</h2>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-200 text-slate-700">
                {prescriptions.length}
              </span>
            </div>
          </div>

          {prescriptions.length === 0 ? (
            <div className="p-6 text-center bg-white rounded-3xl border border-slate-100 text-slate-500 text-xs">
              No prescriptions on file yet. Prescriptions issued by your doctor will appear here automatically.
            </div>
          ) : (
            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden divide-y divide-slate-100">
              {prescriptions.slice(0, 5).map((rx) => (
                <div key={rx.id} className="p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:bg-slate-50/60 transition-colors">
                  <div className="flex items-start gap-3.5">
                    <div className="p-2.5 rounded-2xl bg-mint-50 text-mint-700 border border-mint-200/80 mt-0.5">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-slate-900">{rx.child.full_name}</span>
                        <span className="text-[10px] font-mono px-2 py-0.5 bg-slate-100 rounded text-slate-600">
                          #{rx.prescription_number}
                        </span>
                      </div>
                      <p className="text-xs font-semibold text-slate-700 mt-0.5">
                        Diagnosis: <span className="font-normal text-slate-600">{rx.diagnosis}</span>
                      </p>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Issued by Dr. {rx.doctor.user?.full_name || 'Rajesh Sharma'} on{' '}
                        {new Date(rx.created_at).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => prescriptionsApi.downloadPdf(rx.id, rx.prescription_number)}
                    className="px-4 py-2 bg-primary-50 text-primary-700 hover:bg-primary-100 font-bold text-xs rounded-xl flex items-center gap-1.5 transition-colors self-end sm:self-center"
                  >
                    <Download className="w-3.5 h-3.5" /> Download PDF
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Add Child Modal */}
      {addChildOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 w-full max-w-lg p-6 sm:p-8 space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-primary-600" />
                <h3 className="font-bold text-lg text-slate-900">Add Child Medical Profile</h3>
              </div>
              <button
                onClick={() => setAddChildOpen(false)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateChild} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Child Full Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Aarav Sharma"
                  value={childForm.full_name}
                  onChange={(e) => setChildForm({ ...childForm, full_name: e.target.value })}
                  className="w-full px-4 py-2.5 text-xs rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Date of Birth *
                  </label>
                  <input
                    type="date"
                    required
                    max={new Date().toISOString().split('T')[0]}
                    value={childForm.date_of_birth}
                    onChange={(e) => setChildForm({ ...childForm, date_of_birth: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Gender
                  </label>
                  <select
                    value={childForm.gender}
                    onChange={(e) => setChildForm({ ...childForm, gender: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary-500 bg-white"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Blood Group
                  </label>
                  <select
                    value={childForm.blood_group}
                    onChange={(e) => setChildForm({ ...childForm, blood_group: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary-500 bg-white"
                  >
                    <option value="A+">A+</option>
                    <option value="A-">A-</option>
                    <option value="B+">B+</option>
                    <option value="B-">B-</option>
                    <option value="AB+">AB+</option>
                    <option value="AB-">AB-</option>
                    <option value="O+">O+</option>
                    <option value="O-">O-</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Known Allergies
                </label>
                <input
                  type="text"
                  placeholder="e.g. Peanuts, Penicillin, Milk protein, or None"
                  value={childForm.allergies}
                  onChange={(e) => setChildForm({ ...childForm, allergies: e.target.value })}
                  className="w-full px-4 py-2 text-xs rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Existing Medical Conditions
                </label>
                <input
                  type="text"
                  placeholder="e.g. Asthma, Eczema, Febrile seizures, or None"
                  value={childForm.existing_conditions}
                  onChange={(e) => setChildForm({ ...childForm, existing_conditions: e.target.value })}
                  className="w-full px-4 py-2 text-xs rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setAddChildOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingChild}
                  className="px-5 py-2 bg-primary-600 text-white font-bold text-xs rounded-xl shadow-md hover:bg-primary-700 disabled:opacity-50"
                >
                  {savingChild ? 'Saving...' : 'Save Child Profile'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Cancel Appointment Modal */}
      {cancelModalOpen && selectedApptToCancel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 w-full max-w-md p-6 space-y-4">
            <h3 className="font-bold text-base text-slate-900">Cancel Appointment?</h3>
            <p className="text-xs text-slate-500">
              Are you sure you want to cancel appointment #{selectedApptToCancel.appointment_number} for{' '}
              <span className="font-semibold text-slate-800">{selectedApptToCancel.child.full_name}</span>?
            </p>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Reason for Cancellation</label>
              <textarea
                rows={2}
                placeholder="e.g. Child is feeling better / scheduling conflict"
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:ring-2 focus:ring-rose-500"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setCancelModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Keep Appointment
              </button>
              <button
                type="button"
                onClick={handleCancelAppointment}
                disabled={cancelling}
                className="px-4 py-2 bg-rose-600 text-white font-bold text-xs rounded-xl hover:bg-rose-700 shadow-md disabled:opacity-50"
              >
                {cancelling ? 'Cancelling...' : 'Confirm Cancellation'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
