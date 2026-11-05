import React from 'react';
import { Heart, ShieldCheck, PhoneCall, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { Link } from 'react-router-dom';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-slate-900 text-slate-300 pt-16 pb-12 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Critical Emergency Notice Banner */}
        <div className="mb-12 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-start sm:items-center gap-3">
          <AlertTriangle className="w-6 h-6 text-amber-400 flex-shrink-0 mt-0.5 sm:mt-0" />
          <div className="text-xs sm:text-sm text-amber-200">
            <span className="font-bold text-amber-300">Urgent Pediatric Emergency Notice:</span> CareConnect is designed for planned, non-emergency outpatient consultations. If your child is experiencing severe shortness of breath, continuous convulsions, high unyielding fever, severe dehydration, or trauma, please contact your national emergency number (112 / 102) or rush to the nearest 24/7 pediatric emergency hospital immediately.
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 pb-12 border-b border-slate-800">
          {/* Brand Info */}
          <div className="space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-primary-600 flex items-center justify-center text-white">
                <Heart className="w-5 h-5 fill-white" />
              </div>
              <span className="font-extrabold text-xl text-white tracking-tight">
                Care<span className="text-primary-400">Connect</span>
              </span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              India’s trusted dedicated pediatric telemedicine portal. Safe, empathetic, video-first consultations connecting parents with certified MD pediatricians for your child’s health and well-being.
            </p>
            <div className="flex items-center gap-2 text-xs text-mint-400">
              <ShieldCheck className="w-4 h-4" /> Telemedicine Practice Guidelines Compliant
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-sm font-bold text-white uppercase tracking-wider mb-4">Platform</h4>
            <ul className="space-y-2 text-xs">
              <li><Link to="/" className="hover:text-primary-400 transition-colors">Home & Services</Link></li>
              <li><Link to="/book-appointment" className="hover:text-primary-400 transition-colors">Book Pediatrician</Link></li>
              <li><Link to="/login" className="hover:text-primary-400 transition-colors">Doctor Portal Login</Link></li>
              <li><Link to="/register" className="hover:text-primary-400 transition-colors">Parent Registration</Link></li>
              <li><a href="/#pediatricians" className="hover:text-primary-400 transition-colors">Verified Doctors</a></li>
            </ul>
          </div>

          {/* Pediatric Care Areas */}
          <div>
            <h4 className="text-sm font-bold text-white uppercase tracking-wider mb-4">Care Areas</h4>
            <ul className="space-y-2 text-xs">
              <li className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-primary-400" /> Newborn & Infant Health</li>
              <li className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-primary-400" /> Childhood Allergy & Asthma</li>
              <li className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-primary-400" /> Vaccination & Milestones</li>
              <li className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-primary-400" /> Pediatric Nutrition & Growth</li>
              <li className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-primary-400" /> Skin & Atopic Eczema Care</li>
            </ul>
          </div>

          {/* Regulatory & Telemedicine */}
          <div>
            <h4 className="text-sm font-bold text-white uppercase tracking-wider mb-4">Telemedicine Standards</h4>
            <p className="text-xs text-slate-400 leading-relaxed mb-3">
              All digital prescriptions are generated strictly by licensed pediatricians with registered Medical Council registration numbers in full accordance with the NMC Telemedicine Practice Guidelines.
            </p>
            <div className="p-3 bg-slate-800/80 rounded-xl border border-slate-700/60 text-[11px] text-slate-300 flex items-center gap-2">
              <PhoneCall className="w-4 h-4 text-primary-400 flex-shrink-0" />
              <span>Clinic Helpline: +91 11-4000-CARE</span>
            </div>
          </div>
        </div>

        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
          <p>© 2026 CareConnect Health Technologies Ltd. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <span>Privacy Policy (DPDP Act)</span>
            <span>Guardian Consent Protocols</span>
            <span>Terms of Medical Consultation</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
