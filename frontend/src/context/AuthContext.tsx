import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';
import { authApi } from '../services/api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<User>;
  register: (payload: { email: string; password: string; full_name: string; phone_number?: string; role?: string }) => Promise<User>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  isParent: boolean;
  isDoctor: boolean;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('careconnect_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem('careconnect_token');
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const refreshUser = async () => {
    if (!token) {
      setUser(null);
      setIsLoading(false);
      return;
    }
    try {
      const current = await authApi.getCurrentUser();
      setUser(current);
      localStorage.setItem('careconnect_user', JSON.stringify(current));
    } catch (e) {
      console.error('Failed to restore session:', e);
      logout();
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshUser();
  }, []);

  const login = async (email: string, password: string): Promise<User> => {
    setIsLoading(true);
    try {
      const data = await authApi.login(email, password);
      localStorage.setItem('careconnect_token', data.access_token);
      localStorage.setItem('careconnect_user', JSON.stringify(data.user));
      setToken(data.access_token);
      setUser(data.user);
      return data.user;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (payload: {
    email: string;
    password: string;
    full_name: string;
    phone_number?: string;
    role?: string;
  }): Promise<User> => {
    setIsLoading(true);
    try {
      const data = await authApi.register(payload);
      localStorage.setItem('careconnect_token', data.access_token);
      localStorage.setItem('careconnect_user', JSON.stringify(data.user));
      setToken(data.access_token);
      setUser(data.user);
      return data.user;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('careconnect_token');
    localStorage.removeItem('careconnect_user');
    setToken(null);
    setUser(null);
    window.location.href = '/login';
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user && !!token,
        isLoading,
        login,
        register,
        logout,
        refreshUser,
        isParent: user?.role === 'PARENT',
        isDoctor: user?.role === 'DOCTOR',
        isAdmin: user?.role === 'ADMIN',
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
