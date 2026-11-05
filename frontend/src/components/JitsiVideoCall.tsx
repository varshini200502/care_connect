import React, { useEffect, useState, useRef } from 'react';
import {
  Video,
  Mic,
  MicOff,
  VideoOff,
  PhoneOff,
  Clock,
  Maximize2,
  Minimize2,
  FileText,
  User,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';
import { Appointment } from '../types';
import { useAuth } from '../context/AuthContext';
import { appointmentsApi } from '../services/api';

interface JitsiVideoCallProps {
  appointment: Appointment;
  onEndCall?: () => void;
  onOpenPrescriptionModal?: () => void;
}

export const JitsiVideoCall: React.FC<JitsiVideoCallProps> = ({
  appointment,
  onEndCall,
  onOpenPrescriptionModal,
}) => {
  const { user, isDoctor } = useAuth();
  const [durationSeconds, setDurationSeconds] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'ended'>('connecting');
  const containerRef = useRef<HTMLDivElement>(null);

  // Call timer stopwatch
  useEffect(() => {
    const timer = setInterval(() => {
      setDurationSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Update appointment status to IN_PROGRESS when starting video call
  useEffect(() => {
    if (appointment.status === 'CONFIRMED') {
      appointmentsApi.updateStatus(appointment.id, 'IN_PROGRESS').catch((e) => {
        console.error('Failed to update status to IN_PROGRESS:', e);
      });
    }
    const connectTimer = setTimeout(() => {
      setConnectionStatus('connected');
    }, 1200);
    return () => clearTimeout(connectTimer);
  }, [appointment.id]);

  const formatDuration = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleEndCall = async () => {
    setConnectionStatus('ended');
    try {
      if (isDoctor) {
        await appointmentsApi.updateStatus(appointment.id, 'COMPLETED');
      }
    } catch (e) {
      console.error('Failed to update appointment status to COMPLETED:', e);
    }
    if (onEndCall) onEndCall();
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch((err) => console.error(err));
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch((err) => console.error(err));
      setIsFullscreen(false);
    }
  };

  // Generate safe Jitsi Meet embedded URL
  const displayName = encodeURIComponent(
    isDoctor ? `Dr. ${user?.full_name}` : `${user?.full_name} (Parent of ${appointment.child.full_name})`
  );
  const roomName = encodeURIComponent(appointment.consultation_room_id);
  const jitsiUrl = `https://meet.jit.si/${roomName}#userInfo.displayName="${displayName}"&config.prejoinPageEnabled=false&config.startWithAudioMuted=${isMuted}&config.startWithVideoMuted=${isVideoOff}&config.disableDeepLinking=true`;

  return (
    <div
      ref={containerRef}
      className={`relative w-full rounded-3xl overflow-hidden bg-slate-950 border border-slate-800 shadow-2xl flex flex-col ${
        isFullscreen ? 'h-screen rounded-none' : 'h-[620px]'
      }`}
    >
      {/* Top Overlay Status Bar */}
      <div className="absolute top-0 inset-x-0 z-20 px-6 py-4 bg-gradient-to-b from-slate-950/90 via-slate-950/60 to-transparent flex items-center justify-between text-white pointer-events-auto">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-primary-600/90 backdrop-blur-md flex items-center justify-center shadow-lg">
            <Video className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm tracking-wide">
                Consultation: {appointment.child.full_name}
              </span>
              <span className="flex items-center gap-1 text-[11px] font-semibold bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-500/30">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                Live Video
              </span>
            </div>
            <p className="text-xs text-slate-400">
              {isDoctor ? `Guardian: ${appointment.child.full_name}` : `Specialist: Dr. ${appointment.doctor.user?.full_name || 'Rajesh Sharma'}`}
            </p>
          </div>
        </div>

        {/* Stopwatch & Controls */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-900/80 backdrop-blur-md border border-slate-700/80 text-xs font-mono font-semibold text-slate-200">
            <Clock className="w-3.5 h-3.5 text-primary-400 animate-pulse" />
            <span>{formatDuration(durationSeconds)}</span>
          </div>

          <button
            onClick={toggleFullscreen}
            className="p-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-700/80 text-slate-300 hover:text-white transition-colors"
            title="Toggle Fullscreen"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Embedded Video Call Frame */}
      <div className="flex-1 w-full h-full relative bg-slate-900">
        {connectionStatus === 'ended' ? (
          <div className="w-full h-full flex flex-col items-center justify-center text-white p-6 space-y-4">
            <div className="w-16 h-16 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center border border-rose-500/30">
              <PhoneOff className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold">Consultation Ended</h3>
            <p className="text-sm text-slate-400 max-w-sm text-center">
              The video call has concluded. Total consultation duration: {formatDuration(durationSeconds)}.
            </p>
            {onOpenPrescriptionModal && isDoctor && (
              <button
                onClick={onOpenPrescriptionModal}
                className="px-5 py-2.5 bg-mint-600 text-white font-semibold text-sm rounded-xl shadow-lg hover:bg-mint-700 flex items-center gap-2"
              >
                <FileText className="w-4 h-4" /> Issue Digital Prescription
              </button>
            )}
          </div>
        ) : (
          <iframe
            src={jitsiUrl}
            title="CareConnect Video Consultation"
            allow="camera; microphone; fullscreen; display-capture; autoplay"
            className="w-full h-full border-0"
          />
        )}
      </div>

      {/* Bottom Floating Control Bar */}
      {connectionStatus !== 'ended' && (
        <div className="absolute bottom-6 inset-x-0 z-20 flex items-center justify-center gap-3 px-4 pointer-events-auto">
          <div className="p-2 rounded-2xl bg-slate-950/80 backdrop-blur-xl border border-slate-800 shadow-2xl flex items-center gap-2">
            {/* Doctor Quick Action: Prescription */}
            {isDoctor && onOpenPrescriptionModal && (
              <button
                onClick={onOpenPrescriptionModal}
                className="px-4 py-2.5 rounded-xl bg-primary-600 hover:bg-primary-500 text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-primary-600/30 transition-transform active:scale-95"
              >
                <FileText className="w-4 h-4" />
                <span>Write Prescription</span>
              </button>
            )}

            {/* End Call Button */}
            <button
              onClick={handleEndCall}
              className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-rose-600/30 transition-transform active:scale-95"
            >
              <PhoneOff className="w-4 h-4" />
              <span>End Consultation</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
