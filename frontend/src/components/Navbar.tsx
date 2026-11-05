import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  Heart,
  Calendar,
  MessageSquare,
  Users,
  Shield,
  Clock,
  LogOut,
  Menu,
  X,
  User as UserIcon,
  ChevronDown,
  Stethoscope
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { NotificationBell } from './NotificationBell';

export const Navbar: React.FC = () => {
  const { user, isAuthenticated, logout, isParent, isDoctor, isAdmin } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-100 shadow-sm transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Brand Logo */}
          <div className="flex items-center gap-3">
            <Link to="/" className="flex items-center gap-2.5 group">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-primary-600 to-mint-500 flex items-center justify-center text-white shadow-md shadow-primary-500/20 group-hover:scale-105 transition-transform">
                <Heart className="w-5 h-5 fill-white" />
              </div>
              <div>
                <span className="font-extrabold text-xl tracking-tight text-slate-900 group-hover:text-primary-600 transition-colors">
                  Care<span className="text-primary-600">Connect</span>
                </span>
                <span className="hidden sm:block text-[10px] font-semibold text-mint-600 tracking-wider uppercase -mt-1">
                  Pediatric Telemedicine
                </span>
              </div>
            </Link>
          </div>

          {/* Desktop Navigation Links */}
          <div className="hidden md:flex items-center gap-1 lg:gap-2">
            {!isAuthenticated ? (
              <>
                <Link
                  to="/"
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive('/') ? 'text-primary-600 bg-primary-50' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  Home
                </Link>
                <a
                  href="/#pediatricians"
                  className="px-3 py-2 rounded-lg text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors"
                >
                  Meet Specialists
                </a>
                <a
                  href="/#how-it-works"
                  className="px-3 py-2 rounded-lg text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors"
                >
                  How It Works
                </a>
                <a
                  href="/#services"
                  className="px-3 py-2 rounded-lg text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors"
                >
                  Services
                </a>
                <a
                  href="/#faq"
                  className="px-3 py-2 rounded-lg text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors"
                >
                  FAQ
                </a>
              </>
            ) : (
              <>
                {isParent && (
                  <>
                    <Link
                      to="/dashboard/parent"
                      className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                        isActive('/dashboard/parent')
                          ? 'text-primary-600 bg-primary-50 font-semibold'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                      }`}
                    >
                      Parent Dashboard
                    </Link>
                    <Link
                      to="/book-appointment"
                      className={`px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-1.5 transition-colors ${
                        isActive('/book-appointment')
                          ? 'text-primary-600 bg-primary-50 font-semibold'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                      }`}
                    >
                      <Calendar className="w-4 h-4 text-primary-500" /> Book Consultation
                    </Link>
                    <Link
                      to="/chat"
                      className={`px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-1.5 transition-colors ${
                        isActive('/chat')
                          ? 'text-primary-600 bg-primary-50 font-semibold'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                      }`}
                    >
                      <MessageSquare className="w-4 h-4 text-primary-500" /> Chat & Queries
                    </Link>
                  </>
                )}

                {isDoctor && (
                  <>
                    <Link
                      to="/dashboard/doctor"
                      className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                        isActive('/dashboard/doctor')
                          ? 'text-primary-600 bg-primary-50 font-semibold'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                      }`}
                    >
                      Doctor Dashboard
                    </Link>
                    <Link
                      to="/doctor/availability"
                      className={`px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-1.5 transition-colors ${
                        isActive('/doctor/availability')
                          ? 'text-primary-600 bg-primary-50 font-semibold'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                      }`}
                    >
                      <Clock className="w-4 h-4 text-primary-500" /> Consultation Hours
                    </Link>
                    <Link
                      to="/chat"
                      className={`px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-1.5 transition-colors ${
                        isActive('/chat')
                          ? 'text-primary-600 bg-primary-50 font-semibold'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                      }`}
                    >
                      <MessageSquare className="w-4 h-4 text-primary-500" /> Patient Inbox
                    </Link>
                  </>
                )}

                {isAdmin && (
                  <>
                    <Link
                      to="/dashboard/admin"
                      className={`px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-1.5 transition-colors ${
                        isActive('/dashboard/admin')
                          ? 'text-primary-600 bg-primary-50 font-semibold'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                      }`}
                    >
                      <Shield className="w-4 h-4 text-primary-500" /> Admin Oversight
                    </Link>
                  </>
                )}
              </>
            )}
          </div>

          {/* Right Header CTAs & User Menu */}
          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <>
                <NotificationBell />

                {/* Profile Pill Dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                    className="flex items-center gap-2 p-1.5 pr-3 rounded-full border border-slate-200 bg-slate-50 hover:bg-slate-100 transition-colors focus:outline-none"
                  >
                    <div className="w-8 h-8 rounded-full bg-primary-600 text-white flex items-center justify-center font-bold text-xs uppercase shadow-sm">
                      {user?.full_name?.charAt(0) || 'U'}
                    </div>
                    <div className="hidden lg:block text-left text-xs">
                      <p className="font-semibold text-slate-800 leading-tight truncate max-w-[120px]">
                        {user?.full_name}
                      </p>
                      <p className="text-[10px] text-slate-500 uppercase tracking-wider">
                        {user?.role}
                      </p>
                    </div>
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                  </button>

                  {userDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-slate-100 py-1 z-50 animate-in fade-in slide-in-from-top-2">
                      <div className="px-4 py-3 border-b border-slate-100">
                        <p className="text-xs font-bold text-slate-900">{user?.full_name}</p>
                        <p className="text-xs text-slate-500 truncate">{user?.email}</p>
                        <span className="inline-block mt-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-primary-100 text-primary-700">
                          {user?.role}
                        </span>
                      </div>

                      {isParent && (
                        <Link
                          to="/dashboard/parent"
                          onClick={() => setUserDropdownOpen(false)}
                          className="flex items-center gap-2 px-4 py-2.5 text-xs text-slate-700 hover:bg-slate-50"
                        >
                          <Users className="w-4 h-4 text-slate-400" /> Children Profiles
                        </Link>
                      )}

                      {isDoctor && (
                        <Link
                          to="/dashboard/doctor"
                          onClick={() => setUserDropdownOpen(false)}
                          className="flex items-center gap-2 px-4 py-2.5 text-xs text-slate-700 hover:bg-slate-50"
                        >
                          <Stethoscope className="w-4 h-4 text-slate-400" /> Doctor Console
                        </Link>
                      )}

                      <button
                        onClick={() => {
                          setUserDropdownOpen(false);
                          logout();
                        }}
                        className="w-full flex items-center gap-2 px-4 py-2.5 text-xs text-rose-600 hover:bg-rose-50 transition-colors border-t border-slate-100"
                      >
                        <LogOut className="w-4 h-4 text-rose-500" /> Sign Out
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/login"
                  className="px-4 py-2 text-sm font-semibold text-slate-700 hover:text-primary-600 transition-colors"
                >
                  Log In
                </Link>
                <Link
                  to="/register"
                  className="px-4 py-2 text-sm font-semibold text-white bg-primary-600 hover:bg-primary-700 rounded-xl shadow-md shadow-primary-600/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
                >
                  Register
                </Link>
              </div>
            )}

            {/* Mobile Menu Toggle Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-100 bg-white px-4 pt-2 pb-4 space-y-1 shadow-lg">
          {!isAuthenticated ? (
            <>
              <Link
                to="/"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-lg text-base font-medium text-slate-700 hover:bg-slate-50"
              >
                Home
              </Link>
              <Link
                to="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-lg text-base font-medium text-slate-700 hover:bg-slate-50"
              >
                Log In
              </Link>
              <Link
                to="/register"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-lg text-base font-medium text-primary-600 font-semibold"
              >
                Parent Registration
              </Link>
            </>
          ) : (
            <>
              {isParent && (
                <>
                  <Link
                    to="/dashboard/parent"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block px-3 py-2 rounded-lg text-base font-medium text-slate-700 hover:bg-slate-50"
                  >
                    Parent Dashboard
                  </Link>
                  <Link
                    to="/book-appointment"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block px-3 py-2 rounded-lg text-base font-medium text-slate-700 hover:bg-slate-50"
                  >
                    Book Consultation
                  </Link>
                  <Link
                    to="/chat"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block px-3 py-2 rounded-lg text-base font-medium text-slate-700 hover:bg-slate-50"
                  >
                    Chat & Prescriptions
                  </Link>
                </>
              )}
              {isDoctor && (
                <>
                  <Link
                    to="/dashboard/doctor"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block px-3 py-2 rounded-lg text-base font-medium text-slate-700 hover:bg-slate-50"
                  >
                    Doctor Dashboard
                  </Link>
                  <Link
                    to="/doctor/availability"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block px-3 py-2 rounded-lg text-base font-medium text-slate-700 hover:bg-slate-50"
                  >
                    Consultation Hours
                  </Link>
                  <Link
                    to="/chat"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block px-3 py-2 rounded-lg text-base font-medium text-slate-700 hover:bg-slate-50"
                  >
                    Patient Inbox
                  </Link>
                </>
              )}
              {isAdmin && (
                <Link
                  to="/dashboard/admin"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-3 py-2 rounded-lg text-base font-medium text-slate-700 hover:bg-slate-50"
                >
                  Admin Portal
                </Link>
              )}
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  logout();
                }}
                className="w-full text-left px-3 py-2 text-rose-600 font-medium"
              >
                Sign Out
              </button>
            </>
          )}
        </div>
      )}
    </nav>
  );
};
