import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Heart, Lock, Mail, AlertCircle, ArrowRight, Sparkles, User, Stethoscope, Shield } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const from = (location.state as any)?.from?.pathname;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const user = await login(email, password);
      if (from) {
        navigate(from, { replace: true });
      } else {
        if (user.role === 'PARENT') navigate('/dashboard/parent');
        else if (user.role === 'DOCTOR') navigate('/dashboard/doctor');
        else if (user.role === 'ADMIN') navigate('/dashboard/admin');
        else navigate('/');
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Invalid email or password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fillCredentials = (roleEmail: string, rolePass: string) => {
    setEmail(roleEmail);
    setPassword(rolePass);
    setError(null);
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-slate-50">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center space-y-2">
          <div className="inline-flex w-12 h-12 rounded-2xl bg-gradient-to-tr from-primary-600 to-mint-500 items-center justify-center text-white shadow-lg shadow-primary-500/20">
            <Heart className="w-6 h-6 fill-white" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Welcome to CareConnect
          </h2>
          <p className="text-xs sm:text-sm text-slate-500">
            Log in to access your consultations, prescriptions, and health records.
          </p>
        </div>

        {/* 1-Click Demo Credential Auto-Fill Badges */}
        <div className="p-4 rounded-2xl bg-gradient-to-br from-primary-50 to-mint-50/50 border border-primary-100 shadow-sm space-y-2.5">
          <div className="flex items-center gap-1.5 text-xs font-bold text-primary-800">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" /> Quick Demo 1-Click Login:
          </div>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => fillCredentials('priya.sharma@gmail.com', 'Parent@123')}
              className="p-2 rounded-xl bg-white hover:bg-primary-100/60 border border-slate-200 text-left transition-colors text-[11px]"
            >
              <div className="flex items-center gap-1 font-bold text-primary-700">
                <User className="w-3 h-3" /> Parent
              </div>
              <div className="text-slate-400 truncate">Priya Sharma</div>
            </button>
            <button
              type="button"
              onClick={() => fillCredentials('dr.sharma@careconnect.com', 'Doctor@123')}
              className="p-2 rounded-xl bg-white hover:bg-mint-100/60 border border-slate-200 text-left transition-colors text-[11px]"
            >
              <div className="flex items-center gap-1 font-bold text-mint-700">
                <Stethoscope className="w-3 h-3" /> Doctor
              </div>
              <div className="text-slate-400 truncate">Dr. Rajesh</div>
            </button>
            <button
              type="button"
              onClick={() => fillCredentials('admin@careconnect.com', 'Admin@123')}
              className="p-2 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-left transition-colors text-[11px]"
            >
              <div className="flex items-center gap-1 font-bold text-slate-700">
                <Shield className="w-3 h-3" /> Admin
              </div>
              <div className="text-slate-400 truncate">Admin Portal</div>
            </button>
          </div>
        </div>

        {/* Login Form Card */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-100 space-y-6">
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="email"
                  required
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Password
                </label>
                <Link
                  to="/forgot-password"
                  className="text-xs text-primary-600 hover:text-primary-700 hover:underline font-medium"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3 px-4 bg-primary-600 hover:bg-primary-700 text-white font-bold text-sm rounded-xl shadow-lg shadow-primary-600/20 disabled:opacity-50 flex items-center justify-center gap-2 transition-transform active:scale-[0.99]"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>Sign In to Account</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="text-center pt-2 border-t border-slate-100">
            <p className="text-xs text-slate-500">
              New to CareConnect?{' '}
              <Link to="/register" className="font-bold text-primary-600 hover:text-primary-700 hover:underline">
                Register as a Parent
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
