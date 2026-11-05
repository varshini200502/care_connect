import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { ProtectedRoute } from './components/ProtectedRoute';

// Pages
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { ForgotPasswordPage } from './pages/ForgotPasswordPage';
import { ParentDashboard } from './pages/ParentDashboard';
import { DoctorDashboard } from './pages/DoctorDashboard';
import { AdminDashboard } from './pages/AdminDashboard';
import { BookAppointmentPage } from './pages/BookAppointmentPage';
import { DoctorAvailabilityPage } from './pages/DoctorAvailabilityPage';
import { ChatPage } from './pages/ChatPage';
import { VideoConsultationPage } from './pages/VideoConsultationPage';
import { ChildMedicalHistoryPage } from './pages/ChildMedicalHistoryPage';

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <SocketProvider>
          <div className="min-h-screen flex flex-col bg-slate-50 font-['Plus_Jakarta_Sans',sans-serif] text-slate-800">
            <Navbar />
            <main className="flex-1">
              <Routes>
                {/* Public Pages */}
                <Route path="/" element={<LandingPage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
                <Route path="/forgot-password" element={<ForgotPasswordPage />} />

                {/* Parent Routes */}
                <Route
                  path="/dashboard/parent"
                  element={
                    <ProtectedRoute allowedRoles={['PARENT', 'ADMIN']}>
                      <ParentDashboard />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/book-appointment"
                  element={
                    <ProtectedRoute allowedRoles={['PARENT', 'ADMIN']}>
                      <BookAppointmentPage />
                    </ProtectedRoute>
                  }
                />

                {/* Doctor Routes */}
                <Route
                  path="/dashboard/doctor"
                  element={
                    <ProtectedRoute allowedRoles={['DOCTOR', 'ADMIN']}>
                      <DoctorDashboard />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/doctor/availability"
                  element={
                    <ProtectedRoute allowedRoles={['DOCTOR', 'ADMIN']}>
                      <DoctorAvailabilityPage />
                    </ProtectedRoute>
                  }
                />

                {/* Admin Routes */}
                <Route
                  path="/dashboard/admin"
                  element={
                    <ProtectedRoute allowedRoles={['ADMIN']}>
                      <AdminDashboard />
                    </ProtectedRoute>
                  }
                />

                {/* Shared Telemedicine Routes */}
                <Route
                  path="/chat"
                  element={
                    <ProtectedRoute allowedRoles={['PARENT', 'DOCTOR', 'ADMIN']}>
                      <ChatPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/consultation/:appointmentId"
                  element={
                    <ProtectedRoute allowedRoles={['PARENT', 'DOCTOR', 'ADMIN']}>
                      <VideoConsultationPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/child/:childId/history"
                  element={
                    <ProtectedRoute allowedRoles={['PARENT', 'DOCTOR', 'ADMIN']}>
                      <ChildMedicalHistoryPage />
                    </ProtectedRoute>
                  }
                />

                {/* Fallback */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </main>
            <Footer />
          </div>
        </SocketProvider>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;
