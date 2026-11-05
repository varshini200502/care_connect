import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { useAuth } from './AuthContext';
import { Notification } from '../types';
import { notificationsApi, getWsBaseUrl } from '../services/api';

interface SocketContextType {
  notifications: Notification[];
  unreadCount: number;
  refreshNotifications: () => Promise<void>;
  markAsRead: (id: number) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  isWsConnected: boolean;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { token, isAuthenticated } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isWsConnected, setIsWsConnected] = useState<boolean>(false);
  const wsRef = useRef<WebSocket | null>(null);

  const refreshNotifications = async () => {
    if (!isAuthenticated) return;
    try {
      const data = await notificationsApi.list();
      setNotifications(data);
    } catch (e) {
      console.error('Failed to load notifications:', e);
    }
  };

  const markAsRead = async (id: number) => {
    try {
      await notificationsApi.markRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      );
    } catch (e) {
      console.error('Failed to mark read:', e);
    }
  };

  const markAllAsRead = async () => {
    try {
      await notificationsApi.markAllRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    } catch (e) {
      console.error('Failed to mark all read:', e);
    }
  };

  useEffect(() => {
    if (!isAuthenticated || !token) {
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
      setIsWsConnected(false);
      setNotifications([]);
      return;
    }

    refreshNotifications();

    const wsBase = getWsBaseUrl();
    const wsUrl = `${wsBase}/notifications?token=${encodeURIComponent(token)}`;

    try {
      const socket = new WebSocket(wsUrl);
      wsRef.current = socket;

      socket.onopen = () => {
        setIsWsConnected(true);
      };

      socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'NEW_NOTIFICATION') {
            setNotifications((prev) => [data.notification, ...prev]);
          }
        } catch (err) {
          console.error('Error handling WS notification message:', err);
        }
      };

      socket.onclose = () => {
        setIsWsConnected(false);
      };

      socket.onerror = () => {
        setIsWsConnected(false);
      };

      return () => {
        socket.close();
      };
    } catch (e) {
      console.error('Failed to connect to notification WS:', e);
    }
  }, [isAuthenticated, token]);

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return (
    <SocketContext.Provider
      value={{
        notifications,
        unreadCount,
        refreshNotifications,
        markAsRead,
        markAllAsRead,
        isWsConnected,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};
