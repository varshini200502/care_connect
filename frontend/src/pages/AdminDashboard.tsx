import React, { useState, useEffect } from 'react';
import {
  Shield,
  Users,
  Calendar,
  FileText,
  CheckCircle2,
  XCircle,
  Activity,
  AlertTriangle,
  Lock,
  Unlock,
  Eye,
  TrendingUp,
  Award
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
  PieChart,
  Pie
} from 'recharts';
import { adminApi, doctorsApi } from '../services/api';
import { AdminStats, User, Doctor } from '../types';

export const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'doctors' | 'users' | 'audit'>('overview');

  const loadAdminData = async () => {
    try {
      setLoading(true);
      const [statsData, usersList, docsList, logs] = await Promise.all([
        adminApi.getStats(),
        adminApi.getUsers(),
        doctorsApi.listVerified(),
        adminApi.getAuditLogs(),
      ]);
      setStats(statsData);
      setUsers(usersList);
      setDoctors(docsList);
      setAuditLogs(logs);
    } catch (e) {
      console.error('Failed to load admin stats:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAdminData();
  }, []);

  const handleToggleUser = async (userId: number) => {
    try {
      await adminApi.toggleUserStatus(userId);
      loadAdminData();
    } catch (e) {
      console.error('Failed to toggle user:', e);
    }
  };

  const handleToggleDoctorVerify = async (docId: number) => {
    try {
      await adminApi.toggleDoctorVerify(docId);
      loadAdminData();
    } catch (e) {
      console.error('Failed to verify doctor:', e);
    }
  };

  // Chart data
  const userRoleChartData = [
    { name: 'Parents', count: stats?.total_parents || 0, color: '#0284c7' },
    { name: 'Doctors', count: stats?.total_doctors || 0, color: '#10b981' },
    { name: 'Admins', count: 1, color: '#64748b' },
  ];

  const activityChartData = [
    { name: 'Children', count: stats?.total_children || 0 },
    { name: 'Appointments', count: stats?.total_appointments || 0 },
    { name: 'Prescriptions', count: stats?.total_prescriptions || 0 },
  ];

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Admin Header */}
        <div className="bg-gradient-to-r from-slate-900 via-primary-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6 border border-slate-800">
          <div className="space-y-1">
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-white/10 text-primary-300 border border-white/20 uppercase tracking-wider">
              Platform Administration
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              CareConnect Management Console
            </h1>
            <p className="text-xs text-slate-400">
              User oversight, pediatrician credential verification, tele-consultation metrics, and audit logs.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" /> System Operational
            </span>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 border-b border-slate-200 pb-3 text-xs font-bold">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-4 py-2 rounded-xl transition-all ${
              activeTab === 'overview'
                ? 'bg-primary-600 text-white shadow-md'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            System Overview & Metrics
          </button>
          <button
            onClick={() => setActiveTab('doctors')}
            className={`px-4 py-2 rounded-xl transition-all ${
              activeTab === 'doctors'
                ? 'bg-primary-600 text-white shadow-md'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            Pediatricians Verification ({doctors.length})
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`px-4 py-2 rounded-xl transition-all ${
              activeTab === 'users'
                ? 'bg-primary-600 text-white shadow-md'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            User Accounts ({users.length})
          </button>
          <button
            onClick={() => setActiveTab('audit')}
            className={`px-4 py-2 rounded-xl transition-all ${
              activeTab === 'audit'
                ? 'bg-primary-600 text-white shadow-md'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            Security Audit Logs
          </button>
        </div>

        {/* TAB 1: OVERVIEW */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* KPI Metric Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm space-y-1">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Total Users</span>
                <p className="text-3xl font-extrabold text-slate-900">{stats?.total_users || 0}</p>
                <p className="text-[11px] text-primary-600 font-medium">Registered platform accounts</p>
              </div>

              <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm space-y-1">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Active Pediatricians</span>
                <p className="text-3xl font-extrabold text-mint-600">{stats?.total_doctors || 0}</p>
                <p className="text-[11px] text-slate-400">Board-certified doctors</p>
              </div>

              <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm space-y-1">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Total Appointments</span>
                <p className="text-3xl font-extrabold text-primary-600">{stats?.total_appointments || 0}</p>
                <p className="text-[11px] text-slate-400">Telemedicine sessions</p>
              </div>

              <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm space-y-1">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Prescriptions Issued</span>
                <p className="text-3xl font-extrabold text-purple-600">{stats?.total_prescriptions || 0}</p>
                <p className="text-[11px] text-slate-400">Signed ReportLab PDFs</p>
              </div>
            </div>

            {/* Recharts Analytics Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* User Demographics Chart */}
              <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-4">
                <h3 className="font-bold text-sm text-slate-900">User Distribution by Role</h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={userRoleChartData}>
                      <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} />
                      <YAxis stroke="#94a3b8" fontSize={12} />
                      <Tooltip />
                      <Bar dataKey="count" radius={[8, 8, 0, 0]}>
                        {userRoleChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Clinical Volume Chart */}
              <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-4">
                <h3 className="font-bold text-sm text-slate-900">Clinical Platform Volumes</h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={activityChartData}>
                      <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} />
                      <YAxis stroke="#94a3b8" fontSize={12} />
                      <Tooltip />
                      <Bar dataKey="count" fill="#10b981" radius={[8, 8, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: DOCTOR VERIFICATION */}
        {activeTab === 'doctors' && (
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden p-6 space-y-4">
            <h2 className="text-base font-bold text-slate-900">Pediatrician Credential Verification</h2>
            <p className="text-xs text-slate-500">
              Verify Medical Council registration numbers and grant consultation privileges.
            </p>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-100">
                  <tr>
                    <th className="px-4 py-3">Pediatrician Name</th>
                    <th className="px-4 py-3">Medical Registration</th>
                    <th className="px-4 py-3">Specialization & Degrees</th>
                    <th className="px-4 py-3">Affiliation</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Verification Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {doctors.map((doc) => (
                    <tr key={doc.id}>
                      <td className="px-4 py-3.5 font-bold text-slate-900">{doc.user?.full_name || 'Dr. Rajesh Sharma'}</td>
                      <td className="px-4 py-3.5 font-mono text-slate-600">{doc.license_number}</td>
                      <td className="px-4 py-3.5">{doc.qualification}</td>
                      <td className="px-4 py-3.5">{doc.hospital_affiliation || 'CareConnect'}</td>
                      <td className="px-4 py-3.5">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            doc.is_verified ? 'bg-mint-100 text-mint-700' : 'bg-amber-100 text-amber-700'
                          }`}
                        >
                          {doc.is_verified ? 'Verified & Active' : 'Pending Review'}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        <button
                          onClick={() => handleToggleDoctorVerify(doc.id)}
                          className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-colors ${
                            doc.is_verified
                              ? 'bg-rose-50 text-rose-700 hover:bg-rose-100'
                              : 'bg-mint-600 text-white hover:bg-mint-700'
                          }`}
                        >
                          {doc.is_verified ? 'Revoke Verification' : 'Verify Doctor'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 3: USER ACCOUNTS */}
        {activeTab === 'users' && (
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden p-6 space-y-4">
            <h2 className="text-base font-bold text-slate-900">Platform Registered Users</h2>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-100">
                  <tr>
                    <th className="px-4 py-3">ID</th>
                    <th className="px-4 py-3">Name</th>
                    <th className="px-4 py-3">Email</th>
                    <th className="px-4 py-3">Role</th>
                    <th className="px-4 py-3">Active Status</th>
                    <th className="px-4 py-3 text-right">Account Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {users.map((u) => (
                    <tr key={u.id}>
                      <td className="px-4 py-3.5 font-mono text-slate-400">{u.id}</td>
                      <td className="px-4 py-3.5 font-bold text-slate-900">{u.full_name}</td>
                      <td className="px-4 py-3.5">{u.email}</td>
                      <td className="px-4 py-3.5">
                        <span className="px-2 py-0.5 rounded-md font-bold text-[10px] bg-slate-100 text-slate-700">
                          {u.role}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            u.is_active ? 'bg-mint-100 text-mint-700' : 'bg-rose-100 text-rose-700'
                          }`}
                        >
                          {u.is_active ? 'Active' : 'Deactivated'}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        <button
                          onClick={() => handleToggleUser(u.id)}
                          className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-colors ${
                            u.is_active
                              ? 'bg-slate-100 text-rose-600 hover:bg-rose-50'
                              : 'bg-mint-50 text-mint-700 hover:bg-mint-100'
                          }`}
                        >
                          {u.is_active ? 'Deactivate' : 'Activate'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 4: AUDIT LOGS */}
        {activeTab === 'audit' && (
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden p-6 space-y-4">
            <h2 className="text-base font-bold text-slate-900">System Security & Telemedicine Audit Logs</h2>
            <p className="text-xs text-slate-500">
              Live audit record tracking logins, prescription generations, appointment creations, and modifications.
            </p>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-100">
                  <tr>
                    <th className="px-4 py-3">Timestamp</th>
                    <th className="px-4 py-3">Action</th>
                    <th className="px-4 py-3">Entity Type</th>
                    <th className="px-4 py-3">Entity ID</th>
                    <th className="px-4 py-3">IP Address</th>
                    <th className="px-4 py-3">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700 font-mono text-[11px]">
                  {auditLogs.map((log) => (
                    <tr key={log.id}>
                      <td className="px-4 py-3 text-slate-500">
                        {new Date(log.created_at).toLocaleString()}
                      </td>
                      <td className="px-4 py-3 font-bold text-slate-900">{log.action}</td>
                      <td className="px-4 py-3">{log.entity_type}</td>
                      <td className="px-4 py-3 text-slate-400">#{log.entity_id || '-'}</td>
                      <td className="px-4 py-3 text-slate-500">{log.ip_address || '127.0.0.1'}</td>
                      <td className="px-4 py-3 text-slate-600 font-sans text-xs">{log.details || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
