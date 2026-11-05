import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Heart, Mail, Lock, ArrowRight, CheckCircle2, AlertCircle } from 'lucide-react';
import { authApi } from '../services/api';

export const ForgotPasswordPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [step, setStep] = useState<'request' | 'reset' | 'done'>('request');
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleRequestToken = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const data = await authApi.forgotPassword(email);
      setMessage(data.message);
      if (data.dev_token) {
        setResetToken(data.dev_token);
      }
      setStep('reset');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to process password reset request.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await authApi.resetPassword({
        email,
        temporary_token: resetToken,
        new_password: newPassword,
      });
      setStep('done');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to update password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-slate-50">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center space-y-2">
          <div className="inline-flex w-12 h-12 rounded-2xl bg-primary-600 items-center justify-center text-white shadow-lg">
            <Heart className="w-6 h-6 fill-white" />
          </div>
          <h2 className="text-2xl font-extrabold text-slate-900">
            Password Recovery
          </h2>
          <p className="text-xs text-slate-500">
            Secure password reset for CareConnect platform users
          </p>
        </div>

        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-100 space-y-6">
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" /> {error}
            </div>
          )}

          {step === 'request' && (
            <form onSubmit={handleRequestToken} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Your Registered Email
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                  <input
                    type="email"
                    required
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-primary-600 hover:bg-primary-700 text-white font-bold text-sm rounded-xl shadow-md transition-all"
              >
                {loading ? 'Sending...' : 'Send Reset Instructions'}
              </button>
            </form>
          )}

          {step === 'reset' && (
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div className="p-3 bg-mint-50 rounded-xl border border-mint-200 text-xs text-mint-800">
                {message || 'Verification token sent.'} For local development demo, the token is pre-filled below:
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Reset Token
                </label>
                <input
                  type="text"
                  required
                  value={resetToken}
                  onChange={(e) => setResetToken(e.target.value)}
                  className="w-full px-4 py-2 text-xs rounded-xl border border-slate-200 font-mono bg-slate-50"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Enter New Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="password"
                    required
                    placeholder="Min 6 characters"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 text-sm rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-primary-600 hover:bg-primary-700 text-white font-bold text-sm rounded-xl shadow-md"
              >
                {loading ? 'Updating Password...' : 'Save New Password'}
              </button>
            </form>
          )}

          {step === 'done' && (
            <div className="text-center py-4 space-y-4">
              <div className="w-12 h-12 bg-mint-100 text-mint-600 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h4 className="font-bold text-lg text-slate-800">Password Successfully Changed!</h4>
              <p className="text-xs text-slate-500">
                You can now log in with your updated credentials.
              </p>
              <Link
                to="/login"
                className="inline-block px-6 py-2.5 bg-primary-600 text-white font-bold text-sm rounded-xl shadow-md"
              >
                Back to Sign In
              </Link>
            </div>
          )}

          <div className="text-center pt-2 border-t border-slate-100">
            <Link to="/login" className="text-xs font-bold text-primary-600 hover:underline">
              ← Return to Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
