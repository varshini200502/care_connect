import axios from 'axios';
import {
  User,
  Doctor,
  Child,
  DoctorAvailability,
  Slot,
  Appointment,
  Prescription,
  Conversation,
  Message,
  MedicalRecord,
  Notification,
  AdminStats
} from '../types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

export const getWsBaseUrl = (): string => {
  if (import.meta.env.VITE_WS_BASE_URL) {
    return import.meta.env.VITE_WS_BASE_URL;
  }
  const apiUrl = import.meta.env.VITE_API_BASE_URL;
  if (apiUrl && apiUrl.startsWith('http')) {
    const url = new URL(apiUrl);
    const wsProto = url.protocol === 'https:' ? 'wss:' : 'ws:';
    return `${wsProto}//${url.host}/ws`;
  }
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  return `${protocol}//${window.location.host}/ws`;
};

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to attach JWT token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('careconnect_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor to catch 401 unauthorized
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Don't auto logout on login attempt error
      if (!error.config.url.includes('/auth/login')) {
        localStorage.removeItem('careconnect_token');
        localStorage.removeItem('careconnect_user');
        if (window.location.pathname !== '/login') {
          window.location.href = '/login?expired=true';
        }
      }
    }
    return Promise.reject(error);
  }
);

// ----------------- Auth API -----------------
export const authApi = {
  login: async (email: string, password: string) => {
    const res = await api.post<{ access_token: string; token_type: string; user: User }>('/auth/login', {
      email,
      password,
    });
    return res.data;
  },
  register: async (payload: { email: string; password: string; full_name: string; phone_number?: string; role?: string }) => {
    const res = await api.post<{ access_token: string; token_type: string; user: User }>('/auth/register', payload);
    return res.data;
  },
  getCurrentUser: async () => {
    const res = await api.get<User>('/auth/me');
    return res.data;
  },
  forgotPassword: async (email: string) => {
    const res = await api.post<{ message: string; dev_token?: string }>('/auth/forgot-password', { email });
    return res.data;
  },
  resetPassword: async (payload: { email: string; temporary_token: string; new_password: string }) => {
    const res = await api.post<{ message: string }>('/auth/reset-password', payload);
    return res.data;
  },
};

// ----------------- Children API -----------------
export const childrenApi = {
  list: async () => {
    const res = await api.get<Child[]>('/children/');
    return res.data;
  },
  getById: async (id: number) => {
    const res = await api.get<Child>(`/children/${id}`);
    return res.data;
  },
  create: async (data: Omit<Child, 'id' | 'parent_id' | 'created_at' | 'updated_at'>) => {
    const res = await api.post<Child>('/children/', data);
    return res.data;
  },
  update: async (id: number, data: Partial<Child>) => {
    const res = await api.put<Child>(`/children/${id}`, data);
    return res.data;
  },
  delete: async (id: number) => {
    await api.delete(`/children/${id}`);
  },
};

// ----------------- Doctors API -----------------
export const doctorsApi = {
  listVerified: async () => {
    const res = await api.get<Doctor[]>('/doctors/');
    return res.data;
  },
  getById: async (id: number) => {
    const res = await api.get<Doctor>(`/doctors/${id}`);
    return res.data;
  },
  getSlots: async (doctorId: number, date: string) => {
    const res = await api.get<Slot[]>(`/doctors/${doctorId}/slots?date=${date}`);
    return res.data;
  },
  getAvailability: async (doctorId: number) => {
    const res = await api.get<DoctorAvailability[]>(`/doctors/${doctorId}/availability`);
    return res.data;
  },
  setAvailability: async (data: Omit<DoctorAvailability, 'id' | 'doctor_id'>) => {
    const res = await api.post<DoctorAvailability>('/doctors/availability', data);
    return res.data;
  },
  blockDate: async (data: { blocked_date: string; reason?: string }) => {
    const res = await api.post('/doctors/blocked-dates', data);
    return res.data;
  },
};

// ----------------- Appointments API -----------------
export const appointmentsApi = {
  list: async (status?: string) => {
    const url = status ? `/appointments/?status=${status}` : '/appointments/';
    const res = await api.get<Appointment[]>(url);
    return res.data;
  },
  getById: async (id: number) => {
    const res = await api.get<Appointment>(`/appointments/${id}`);
    return res.data;
  },
  create: async (data: {
    child_id: number;
    doctor_id: number;
    appointment_date: string;
    start_time: string;
    end_time: string;
    reason: string;
  }) => {
    const res = await api.post<Appointment>('/appointments/', data);
    return res.data;
  },
  updateStatus: async (id: number, status: string) => {
    const res = await api.put<Appointment>(`/appointments/${id}/status`, { status });
    return res.data;
  },
  cancel: async (id: number, cancellation_reason: string) => {
    const res = await api.post<Appointment>(`/appointments/${id}/cancel`, { cancellation_reason });
    return res.data;
  },
  reschedule: async (
    id: number,
    data: { appointment_date: string; start_time: string; end_time: string; reason?: string }
  ) => {
    const res = await api.post<Appointment>(`/appointments/${id}/reschedule`, data);
    return res.data;
  },
};

// ----------------- Chat API -----------------
export const chatApi = {
  getConversations: async () => {
    const res = await api.get<Conversation[]>('/chat/conversations');
    return res.data;
  },
  getMessages: async (conversationId: number) => {
    const res = await api.get<Message[]>(`/chat/conversations/${conversationId}/messages`);
    return res.data;
  },
  sendMessage: async (
    conversationId: number,
    data: { message_text: string; message_type?: string; attachment_url?: string; attachment_name?: string }
  ) => {
    const res = await api.post<Message>(`/chat/conversations/${conversationId}/messages`, data);
    return res.data;
  },
  uploadAttachment: async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await api.post<{ attachment_url: string; attachment_name: string; message_type: string }>(
      '/chat/upload',
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    );
    return res.data;
  },
  markRead: async (conversationId: number) => {
    await api.put(`/chat/conversations/${conversationId}/read`);
  },
};

// ----------------- Prescriptions API -----------------
export const prescriptionsApi = {
  create: async (data: {
    appointment_id: number;
    diagnosis: string;
    additional_advice?: string;
    follow_up_date?: string;
    items: Array<{
      medicine_name: string;
      dosage: string;
      frequency: string;
      duration: string;
      instructions?: string;
    }>;
  }) => {
    const res = await api.post<Prescription>('/prescriptions/', data);
    return res.data;
  },
  getById: async (id: number) => {
    const res = await api.get<Prescription>(`/prescriptions/${id}`);
    return res.data;
  },
  getByChild: async (childId: number) => {
    const res = await api.get<Prescription[]>(`/prescriptions/child/${childId}`);
    return res.data;
  },
  downloadPdf: async (id: number, prescriptionNumber: string) => {
    const res = await api.get(`/prescriptions/${id}/download`, {
      responseType: 'blob',
    });
    const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${prescriptionNumber}.pdf`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  },
};

// ----------------- Medical Records API -----------------
export const medicalRecordsApi = {
  getByChild: async (childId: number) => {
    const res = await api.get<MedicalRecord[]>(`/medical-records/child/${childId}`);
    return res.data;
  },
  upload: async (formData: FormData) => {
    const res = await api.post<MedicalRecord>('/medical-records/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
  },
  download: async (recordId: number, fileName: string) => {
    const res = await api.get(`/medical-records/${recordId}/download`, {
      responseType: 'blob',
    });
    const url = window.URL.createObjectURL(new Blob([res.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', fileName);
    document.body.appendChild(link);
    link.click();
    link.remove();
  },
};

// ----------------- Notifications API -----------------
export const notificationsApi = {
  list: async () => {
    const res = await api.get<Notification[]>('/notifications/');
    return res.data;
  },
  markRead: async (id: number) => {
    await api.put(`/notifications/${id}/read`);
  },
  markAllRead: async () => {
    await api.put('/notifications/read-all');
  },
};

// ----------------- Admin API -----------------
export const adminApi = {
  getStats: async () => {
    const res = await api.get<AdminStats>('/admin/stats');
    return res.data;
  },
  getUsers: async (role?: string) => {
    const url = role ? `/admin/users?role=${role}` : '/admin/users';
    const res = await api.get<User[]>(url);
    return res.data;
  },
  toggleUserStatus: async (userId: number) => {
    const res = await api.put<User>(`/admin/users/${userId}/toggle-status`);
    return res.data;
  },
  toggleDoctorVerify: async (doctorId: number) => {
    const res = await api.put<{ status: string; is_verified: boolean }>(`/admin/doctors/${doctorId}/verify`);
    return res.data;
  },
  getAuditLogs: async () => {
    const res = await api.get('/admin/audit-logs');
    return res.data;
  },
};
