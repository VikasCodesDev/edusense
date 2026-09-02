'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import api from '@/lib/api';

export interface User {
  id?: string;
  _id?: string;
  name: string;
  email: string;
  role: 'student' | 'faculty' | 'admin';
  studentId?: string;
  department?: string;
}

interface AuthContextType {
  user: User | null;
  studentData: any | null;
  token: string | null;
  loading: boolean;
  login: (email: string, pass: string, role?: 'student' | 'faculty' | 'admin') => Promise<{ success: boolean; role?: string; error?: string }>;
  logout: () => void;
  switchDemoAccount: (role: 'student' | 'faculty' | 'admin', email?: string) => Promise<boolean>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [studentData, setStudentData] = useState<any | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = async () => {
    try {
      const savedToken = localStorage.getItem('edusense_token');
      if (!savedToken) {
        setUser(null);
        setStudentData(null);
        setLoading(false);
        return;
      }

      setToken(savedToken);
      const res = await api.get('/auth/me');
      if (res.data && res.data.success) {
        setUser(res.data.user);
        setStudentData(res.data.student || null);
        localStorage.setItem('edusense_user', JSON.stringify(res.data.user));
      }
    } catch (err) {
      console.warn('Session verification failed, logging out.');
      localStorage.removeItem('edusense_token');
      localStorage.removeItem('edusense_user');
      setUser(null);
      setToken(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshUser();
  }, []);

  const login = async (email: string, pass: string, role?: 'student' | 'faculty' | 'admin') => {
    try {
      const res = await api.post('/auth/login', { email, password: pass, role });
      if (res.data && res.data.success) {
        const receivedToken = res.data.token;
        const receivedUser = res.data.user;
        localStorage.setItem('edusense_token', receivedToken);
        localStorage.setItem('edusense_user', JSON.stringify(receivedUser));
        setToken(receivedToken);
        setUser(receivedUser);
        await refreshUser();
        return { success: true, role: receivedUser.role };
      }
      return { success: false, error: 'Login failed.' };
    } catch (err: any) {
      const msg = err.response?.data?.error || 'Invalid credentials. Please try again.';
      return { success: false, error: msg };
    }
  };

  const logout = () => {
    localStorage.removeItem('edusense_token');
    localStorage.removeItem('edusense_user');
    setUser(null);
    setStudentData(null);
    setToken(null);
    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }
  };

  const switchDemoAccount = async (role: 'student' | 'faculty' | 'admin', email?: string) => {
    let targetEmail = email;
    let targetPass = '';

    if (role === 'admin') {
      targetEmail = 'admin@edusense.edu';
      targetPass = 'Admin@123';
    } else if (role === 'faculty') {
      targetEmail = 'faculty@edusense.edu';
      targetPass = 'Faculty@123';
    } else {
      targetEmail = email || 'student1@edusense.edu';
      targetPass = 'Student@123';
    }

    const result = await login(targetEmail, targetPass, role);
    if (result.success) {
      if (typeof window !== 'undefined') {
        if (role === 'student') window.location.href = '/student/dashboard';
        else if (role === 'faculty') window.location.href = '/faculty/dashboard';
        else if (role === 'admin') window.location.href = '/admin/dashboard';
      }
      return true;
    }
    return false;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        studentData,
        token,
        loading,
        login,
        logout,
        switchDemoAccount,
        refreshUser
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
