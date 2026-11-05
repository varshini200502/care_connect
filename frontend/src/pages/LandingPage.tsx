import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Heart,
  Video,
  Calendar,
  FileText,
  ShieldCheck,
  Star,
  Clock,
  ArrowRight,
  CheckCircle,
  HelpCircle,
  Sparkles,
  Award,
  ChevronDown,
  Users,
  Activity
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const LandingPage: React.FC = () => {
  const { isAuthenticated, user, login } = useAuth();
  const navigate = useNavigate();
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [quickLoginLoading, setQuickLoginLoading] = useState<string | null>(null);

  const toggleFaq = (index: number) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  const handleQuickDemoLogin = async (roleName: string, email: string, pass: string) => {
    setQuickLoginLoading(roleName);
    try {
      const loggedUser = await login(email, pass);
      if (loggedUser.role === 'PARENT') navigate('/dashboard/parent');
      else if (loggedUser.role === 'DOCTOR') navigate('/dashboard/doctor');
      else if (loggedUser.role === 'ADMIN') navigate('/dashboard/admin');
    } catch (e) {
      console.error(e);
    } finally {
      setQuickLoginLoading(null);
    }
  };

  const faqs = [
    {
      q: 'How does an online pediatric consultation work?',
      a: 'After creating your free parent account and adding your child’s profile, you choose an available 30-minute consultation slot. At the appointed time, you join a secure, private video consultation room where your pediatrician evaluates your child, answers questions, and issues a digitally signed prescription with a downloadable PDF.',
    },
    {
      q: 'Is CareConnect suitable for emergency medical issues?',
      a: 'No. CareConnect is strictly intended for non-emergency outpatient pediatric concerns such as respiratory allergies, fever follow-up, mild coughs, skin rashes, dietary planning, and growth assessments. In life-threatening emergencies, please rush to the nearest hospital immediately.',
    },
    {
      q: 'Can I download the doctor’s prescription as a PDF?',
      a: 'Yes! Immediately after your consultation, your doctor issues a digitally signed prescription complete with diagnosis, medicine names, exact pediatric dosages, frequencies, and precautions. You can view it in your dashboard, download it as a formal PDF, or access it anytime inside your chat thread.',
    },
    {
      q: 'Can I consult with the same doctor for multiple children?',
      a: 'Absolutely. A single parent account can register multiple children profiles, each maintaining separate medical histories, allergies, past consultations, and prescriptions.',
    },
  ];

  return (
    <div className="bg-slate-50 min-h-screen text-slate-800">
      {/* Quick Demo Access Bar */}
      {!isAuthenticated && (
        <div className="bg-gradient-to-r from-primary-900 via-slate-900 to-mint-900 text-white px-4 py-2.5 shadow-md">
          <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span className="font-semibold text-slate-200">Instant Demo Roles:</span>
              <span className="hidden sm:inline text-slate-400">Click any role to test full platform:</span>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => handleQuickDemoLogin('parent', 'priya.sharma@gmail.com', 'Parent@123')}
                disabled={!!quickLoginLoading}
                className="px-2.5 py-1 rounded-lg bg-primary-600/80 hover:bg-primary-600 text-white font-medium transition-all"
              >
                {quickLoginLoading === 'parent' ? 'Logging in...' : '👤 Parent (Priya)'}
              </button>
              <button
                onClick={() => handleQuickDemoLogin('doctor', 'dr.sharma@careconnect.com', 'Doctor@123')}
                disabled={!!quickLoginLoading}
                className="px-2.5 py-1 rounded-lg bg-mint-600/80 hover:bg-mint-600 text-white font-medium transition-all"
              >
                {quickLoginLoading === 'doctor' ? 'Logging in...' : '🩺 Pediatrician (Dr. Sharma)'}
              </button>
              <button
                onClick={() => handleQuickDemoLogin('admin', 'admin@careconnect.com', 'Admin@123')}
                disabled={!!quickLoginLoading}
                className="px-2.5 py-1 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-200 font-medium transition-all"
              >
                {quickLoginLoading === 'admin' ? 'Logging in...' : '🛡️ Admin'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Hero Section */}
      <section className="relative pt-12 pb-20 overflow-hidden bg-gradient-to-b from-primary-50/70 via-white to-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-primary-100/80 border border-primary-200 text-primary-700 text-xs font-bold tracking-wide uppercase">
                <Heart className="w-3.5 h-3.5 fill-primary-600 text-primary-600" />
                Trusted Pediatric Healthcare Portal
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-tight leading-[1.15]">
                Specialized Pediatric Care for Your Child,{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-600 to-mint-600">
                  from the Comfort of Home.
                </span>
              </h1>

              <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto lg:mx-0 leading-relaxed font-normal">
                Connect directly with verified pediatricians via high-definition video consultations. Enjoy real-time messaging, secure child health records, and official digital prescriptions generated in minutes.
              </p>

              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4 pt-2">
                <Link
                  to={isAuthenticated ? (user?.role === 'DOCTOR' ? '/dashboard/doctor' : '/dashboard/parent') : '/register'}
                  className="px-7 py-3.5 text-base font-bold text-white bg-primary-600 hover:bg-primary-700 rounded-2xl shadow-lg shadow-primary-600/25 flex items-center gap-2 transition-all hover:scale-105 active:scale-95"
                >
                  {isAuthenticated ? 'Go to Dashboard' : 'Register Your Child'}
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  to="/book-appointment"
                  className="px-6 py-3.5 text-base font-semibold text-slate-700 bg-white hover:bg-slate-100 rounded-2xl border border-slate-200 shadow-sm transition-all"
                >
                  View Available Slots
                </Link>
              </div>

              {/* Trust Badges */}
              <div className="pt-6 grid grid-cols-3 gap-4 border-t border-slate-200/80 max-w-lg mx-auto lg:mx-0 text-left">
                <div>
                  <p className="text-2xl font-black text-slate-900">100%</p>
                  <p className="text-xs text-slate-500 font-medium">Verified MD Doctors</p>
                </div>
                <div>
                  <p className="text-2xl font-black text-slate-900">4.95 ★</p>
                  <p className="text-xs text-slate-500 font-medium">Parent Satisfaction</p>
                </div>
                <div>
                  <p className="text-2xl font-black text-slate-900">Encrypted</p>
                  <p className="text-xs text-slate-500 font-medium">Child Data Privacy</p>
                </div>
              </div>
            </div>

            {/* Hero Visual Card */}
            <div className="lg:col-span-5 relative">
              <div className="relative mx-auto max-w-md bg-white rounded-3xl p-6 shadow-2xl border border-slate-100 space-y-6">
                <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-primary-100 flex items-center justify-center text-primary-700 font-black text-lg">
                      RS
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-slate-900">Dr. Rajesh Sharma</h4>
                      <p className="text-xs text-slate-500">MD Pediatrics (AIIMS New Delhi)</p>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-mint-100 text-mint-700 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-mint-500 animate-pulse" /> Available Today
                  </span>
                </div>

                {/* Consultation Preview Box */}
                <div className="p-4 rounded-2xl bg-slate-900 text-white relative overflow-hidden space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                      <Video className="w-4 h-4 text-mint-400" /> Jitsi Encrypted HD Video
                    </span>
                    <span className="text-[10px] font-mono bg-slate-800 px-2 py-0.5 rounded text-primary-300">
                      ROOM #PEDIATRICS-441
                    </span>
                  </div>
                  <div className="py-6 text-center space-y-1">
                    <p className="text-xs text-slate-400">Scheduled Outpatient Consultation</p>
                    <p className="text-lg font-bold text-white">Aarav Sharma (3 yrs)</p>
                    <p className="text-xs text-mint-400 font-medium">Complaint: Dry Barking Cough</p>
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t border-slate-800 text-xs">
                    <span className="text-slate-400">Slot: 11:30 AM - 12:00 PM</span>
                    <span className="text-emerald-400 font-bold">Confirmed</span>
                  </div>
                </div>

                {/* Digital Prescription Mock Pill */}
                <div className="p-3.5 rounded-2xl bg-mint-50 border border-mint-200/80 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <FileText className="w-5 h-5 text-mint-600" />
                    <div>
                      <p className="text-xs font-bold text-slate-900">Official Digital Prescription</p>
                      <p className="text-[11px] text-slate-500">Signed with NMC Reg #MCI-88421</p>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 bg-white text-mint-700 font-bold text-xs rounded-xl shadow-sm border border-mint-200">
                    PDF Ready
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Pediatrician Section */}
      <section id="pediatricians" className="py-20 bg-white border-y border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto space-y-3 mb-14">
            <span className="text-xs font-bold text-primary-600 tracking-wider uppercase bg-primary-50 px-3 py-1 rounded-full">
              Leading Medical Faculty
            </span>
            <h2 className="text-3xl font-extrabold text-slate-900">
              Meet Our Senior Pediatrician
            </h2>
            <p className="text-sm text-slate-600">
              Experienced, board-certified pediatricians committed to gentle, personalized care for your infant, toddler, or child.
            </p>
          </div>

          <div className="max-w-4xl mx-auto bg-gradient-to-br from-slate-50 to-primary-50/30 rounded-3xl p-8 border border-slate-200/80 shadow-md">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
              <div className="md:col-span-4 flex flex-col items-center text-center space-y-3">
                <div className="w-32 h-32 rounded-3xl bg-gradient-to-tr from-primary-600 to-mint-500 p-1 shadow-xl">
                  <div className="w-full h-full bg-white rounded-[22px] flex items-center justify-center text-primary-700 font-extrabold text-3xl">
                    RS
                  </div>
                </div>
                <div>
                  <h3 className="font-extrabold text-lg text-slate-900">Dr. Rajesh Sharma</h3>
                  <p className="text-xs text-primary-600 font-semibold">Chief Pediatric Consultant</p>
                </div>
                <div className="flex items-center gap-1 text-amber-500 text-xs font-bold">
                  <Star className="w-4 h-4 fill-amber-400" />
                  <span>4.95 / 5.0 (340+ reviews)</span>
                </div>
              </div>

              <div className="md:col-span-8 space-y-4">
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="p-3 bg-white rounded-xl border border-slate-200/80 shadow-sm">
                    <p className="text-slate-400 font-medium">Qualification</p>
                    <p className="font-bold text-slate-800">MBBS, MD (Pediatrics, AIIMS)</p>
                  </div>
                  <div className="p-3 bg-white rounded-xl border border-slate-200/80 shadow-sm">
                    <p className="text-slate-400 font-medium">Experience</p>
                    <p className="font-bold text-slate-800">12+ Years Clinical Practice</p>
                  </div>
                  <div className="p-3 bg-white rounded-xl border border-slate-200/80 shadow-sm">
                    <p className="text-slate-400 font-medium">Medical License</p>
                    <p className="font-bold text-slate-800">MCI-DMR-2014-88421 (Verified)</p>
                  </div>
                  <div className="p-3 bg-white rounded-xl border border-slate-200/80 shadow-sm">
                    <p className="text-slate-400 font-medium">Hospital Affiliation</p>
                    <p className="font-bold text-slate-800">Apollo Cradle & CareConnect</p>
                  </div>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed">
                  "Every child deserves compassionate, evidence-based medical guidance without the stress of hospital waiting rooms. Our tele-consultation platform allows me to observe the child in their natural comfortable setting while offering structured prescriptions and follow-ups."
                </p>

                <div className="pt-2 flex items-center justify-between">
                  <div>
                    <span className="text-xs text-slate-500">Consultation Fee:</span>{' '}
                    <span className="font-bold text-slate-900 text-sm">₹600 / 30-min session</span>
                  </div>
                  <Link
                    to="/book-appointment"
                    className="px-5 py-2.5 bg-primary-600 text-white font-semibold text-xs rounded-xl shadow-md shadow-primary-600/20 hover:bg-primary-700 flex items-center gap-1.5 transition-all"
                  >
                    <Calendar className="w-3.5 h-3.5" /> Book with Dr. Sharma
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How CareConnect Works */}
      <section id="how-it-works" className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto space-y-3 mb-16">
            <span className="text-xs font-bold text-mint-600 tracking-wider uppercase bg-mint-50 px-3 py-1 rounded-full">
              Simple 4-Step Process
            </span>
            <h2 className="text-3xl font-extrabold text-slate-900">
              How CareConnect Works
            </h2>
            <p className="text-sm text-slate-600">
              Designed with busy parents in mind: easy scheduling, safe video rooms, and direct prescription delivery.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                step: '01',
                title: 'Register & Add Child',
                desc: 'Create your parent account in under 60 seconds and add your child’s medical details, allergies, and birth date.',
                icon: Users,
              },
              {
                step: '02',
                title: 'Select Appointment Slot',
                desc: 'Browse doctor availability and choose a convenient consultation slot. Instant booking avoids all double-bookings.',
                icon: Calendar,
              },
              {
                step: '03',
                title: 'Join HD Video Room',
                desc: 'Click your unique secure consultation link to enter an encrypted video call directly in your browser without installs.',
                icon: Video,
              },
              {
                step: '04',
                title: 'Download Prescription',
                desc: 'Receive your doctor’s signed digital prescription right in chat and download a formal PDF for medical records and pharmacy.',
                icon: FileText,
              },
            ].map((item, i) => (
              <div
                key={i}
                className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden"
              >
                <div className="text-3xl font-black text-slate-100 absolute top-4 right-5">
                  {item.step}
                </div>
                <div className="w-12 h-12 rounded-2xl bg-primary-50 text-primary-600 flex items-center justify-center mb-5">
                  <item.icon className="w-6 h-6" />
                </div>
                <h4 className="font-bold text-base text-slate-900 mb-2">{item.title}</h4>
                <p className="text-xs text-slate-500 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section id="services" className="py-20 bg-white border-y border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto space-y-3 mb-16">
            <span className="text-xs font-bold text-primary-600 tracking-wider uppercase bg-primary-50 px-3 py-1 rounded-full">
              Comprehensive Pediatric Care
            </span>
            <h2 className="text-3xl font-extrabold text-slate-900">
              Conditions We Treat Online
            </h2>
            <p className="text-sm text-slate-600">
              From common infant cold to complex childhood skin and respiratory allergies.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                title: 'Cough, Cold & Mild Fevers',
                desc: 'Expert guidance on respiratory ailments, steam management, fever charting, and safe pediatric antipyretics.',
              },
              {
                title: 'Childhood Eczema & Rashes',
                desc: 'Clinical evaluation of atopic dermatitis, diaper rashes, hives, barrier repair routines, and topical care.',
              },
              {
                title: 'Growth & Nutritional Screening',
                desc: 'Personalized weaning guidance, developmental milestones, complementary feeding, and iron/vitamin supplementation.',
              },
              {
                title: 'Asthma & Environmental Allergies',
                desc: 'Allergy action plans, trigger prevention, inhaler and spacer technique coaching for toddlers and schoolchildren.',
              },
              {
                title: 'Immunization Schedules',
                desc: 'Verification of national and IAP vaccination charts, catch-up schedules, and post-vaccination query support.',
              },
              {
                title: 'Tummy Aches & Digestive Issues',
                desc: 'Colic relief strategies, infant reflux, loose stools, oral rehydration therapy, and milk protein intolerances.',
              },
            ].map((srv, i) => (
              <div
                key={i}
                className="p-6 rounded-3xl bg-slate-50 border border-slate-100 hover:border-primary-200 transition-colors space-y-2.5"
              >
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-mint-600" />
                  <h4 className="font-bold text-sm text-slate-900">{srv.title}</h4>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed">{srv.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Frequently Asked Questions */}
      <section id="faq" className="py-20 bg-slate-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-3 mb-14">
            <span className="text-xs font-bold text-primary-600 tracking-wider uppercase bg-primary-50 px-3 py-1 rounded-full">
              Common Questions
            </span>
            <h2 className="text-3xl font-extrabold text-slate-900">
              Frequently Asked Questions
            </h2>
            <p className="text-sm text-slate-600">
              Everything you need to know about our pediatric telemedicine service.
            </p>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, i) => (
              <div
                key={i}
                className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-sm transition-all"
              >
                <button
                  onClick={() => toggleFaq(i)}
                  className="w-full px-6 py-4 text-left flex items-center justify-between text-slate-900 font-bold text-sm hover:text-primary-600 transition-colors focus:outline-none"
                >
                  <span>{faq.q}</span>
                  <ChevronDown
                    className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${
                      openFaq === i ? 'rotate-180 text-primary-600' : ''
                    }`}
                  />
                </button>
                {openFaq === i && (
                  <div className="px-6 pb-4 pt-1 text-xs text-slate-600 leading-relaxed border-t border-slate-100">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Bottom CTA Banner */}
      <section className="py-16 bg-gradient-to-r from-primary-600 to-mint-600 text-white text-center">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
            Ready to Consult with Dr. Sharma for Your Child?
          </h2>
          <p className="text-sm sm:text-base text-white/90 max-w-xl mx-auto">
            Book your convenient online video consultation today. No clinic waiting rooms, no traffic hassle.
          </p>
          <div className="pt-2 flex flex-wrap items-center justify-center gap-4">
            <Link
              to="/book-appointment"
              className="px-8 py-3.5 bg-white text-primary-700 font-bold text-sm rounded-2xl shadow-xl hover:bg-slate-50 transition-transform hover:scale-105 active:scale-95"
            >
              Book an Appointment Now
            </Link>
            <Link
              to="/register"
              className="px-6 py-3.5 bg-primary-700/60 hover:bg-primary-700 text-white font-semibold text-sm rounded-2xl border border-white/20 transition-all"
            >
              Register Free Account
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};
