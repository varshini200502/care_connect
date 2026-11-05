import React, { useState, useRef, useEffect } from 'react';
import { Bell, Check, Clock, FileText, Calendar, MessageSquare, AlertCircle } from 'lucide-react';
import { useSocket } from '../context/SocketContext';
import { useNavigate } from 'react-router-dom';

export const NotificationBell: React.FC = () => {
  const { notifications, unreadCount, markAsRead, markAllAsRead, isWsConnected } = useSocket();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getIcon = (type: string) => {
    switch (type) {
      case 'APPOINTMENT':
        return <Calendar className="w-4 h-4 text-primary-600" />;
      case 'PRESCRIPTION':
        return <FileText className="w-4 h-4 text-mint-600" />;
      case 'CHAT':
        return <MessageSquare className="w-4 h-4 text-purple-600" />;
      default:
        return <AlertCircle className="w-4 h-4 text-amber-600" />;
    }
  };

  const handleNotificationClick = (n: any) => {
    if (!n.is_read) {
      markAsRead(n.id);
    }
    setIsOpen(false);
    if (n.notification_type === 'CHAT') {
      navigate('/chat');
    } else if (n.notification_type === 'PRESCRIPTION') {
      navigate('/dashboard/parent');
    } else if (n.notification_type === 'APPOINTMENT') {
      navigate('/dashboard/parent');
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-slate-600 hover:text-primary-600 hover:bg-primary-50 rounded-full transition-all focus:outline-none"
        title="Notifications"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-bold text-white bg-rose-500 rounded-full ring-2 ring-white animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-slate-100 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
          <div className="flex items-center justify-between px-4 py-3 bg-slate-50 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-sm text-slate-800">Notifications</span>
              {unreadCount > 0 && (
                <span className="text-xs bg-primary-100 text-primary-700 font-semibold px-2 py-0.5 rounded-full">
                  {unreadCount} new
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-xs text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1 hover:underline"
              >
                <Check className="w-3.5 h-3.5" /> Mark all read
              </button>
            )}
          </div>

          <div className="max-h-96 overflow-y-auto divide-y divide-slate-100">
            {notifications.length === 0 ? (
              <div className="py-8 text-center text-slate-400">
                <Bell className="w-8 h-8 mx-auto mb-2 opacity-30" />
                <p className="text-sm">No notifications yet</p>
              </div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  onClick={() => handleNotificationClick(n)}
                  className={`p-3.5 transition-colors cursor-pointer hover:bg-slate-50 flex gap-3 ${
                    !n.is_read ? 'bg-primary-50/40' : ''
                  }`}
                >
                  <div className="mt-0.5 p-2 rounded-xl bg-white shadow-sm border border-slate-100 flex-shrink-0">
                    {getIcon(n.notification_type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-xs ${!n.is_read ? 'font-bold text-slate-900' : 'font-semibold text-slate-700'}`}>
                      {n.title}
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{n.message}</p>
                    <div className="flex items-center gap-1 text-[10px] text-slate-400 mt-1">
                      <Clock className="w-3 h-3" />
                      {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                  {!n.is_read && (
                    <span className="w-2 h-2 rounded-full bg-primary-600 self-center flex-shrink-0" />
                  )}
                </div>
              ))
            )}
          </div>

          <div className="px-4 py-2 bg-slate-50 border-t border-slate-100 text-center">
            <span className="text-[11px] text-slate-400 flex items-center justify-center gap-1.5">
              <span className={`w-1.5 h-1.5 rounded-full ${isWsConnected ? 'bg-mint-500' : 'bg-amber-400'}`} />
              {isWsConnected ? 'Real-time WebSocket active' : 'Connecting real-time feed...'}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
