'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { GraduationCap, Lock, Mail, User, AlertCircle, ArrowRight } from 'lucide-react';
import MagneticButton from '@/components/MagneticButton';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();

  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('student1@edusense.edu');
  const [password, setPassword] = useState('Student@123');
  const [name, setName] = useState('');
  const [role, setRole] = useState<'student' | 'faculty' | 'admin'>('student');
  const [studentId, setStudentId] = useState('');
  const [semester, setSemester] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (mode === 'login') {
        const res = await login(email, password, role);
        if (res.success) {
          if (res.role === 'student') router.push('/student/dashboard');
          else if (res.role === 'faculty') router.push('/faculty/dashboard');
          else router.push('/admin/dashboard');
        } else {
          setError(res.error || 'Login failed. Please check your credentials.');
        }
      } else {
        // Register flow
        const regRes = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, email, password, role: 'student', studentId, semester })
        });
        const data = await regRes.json();
        if (data.success) {
          const logRes = await login(email, password);
          if (logRes.success) {
            router.push('/student/dashboard');
          }
        } else {
          setError(data.error || 'Registration failed.');
        }
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  const setDemoUser = (userRole: 'student' | 'faculty' | 'admin', userEmail: string, userPass: string) => {
    setEmail(userEmail);
    setPassword(userPass);
    setRole(userRole);
    setError(null);
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 sm:px-6 lg:px-8 py-12">
      <div className="w-full max-w-md space-y-8">
        
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-indigo-600 text-white shadow-lg shadow-indigo-500/30">
            <GraduationCap className="w-6 h-6" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
            {mode === 'login' ? 'Sign in to EduSense' : 'Create EduSense Account'}
          </h2>
          <p className="text-xs text-slate-400">
            AI-Based Academic Risk Prediction & Personalized Learning System
          </p>
        </div>

        {/* Quick Demo Selector */}
        <div className="subtle-card rounded-xl p-3 border border-indigo-500/30 bg-[#0d1424] space-y-2">
          <div className="flex items-center justify-between text-[11px] font-semibold text-slate-400 uppercase tracking-wider px-1">
            <span>One-Click Demo Personas:</span>
            <span className="text-indigo-400 font-mono">Pre-filled</span>
          </div>

          <div className="grid grid-cols-3 gap-1.5 text-xs">
            <button
              type="button"
              onClick={() => setDemoUser('student', 'student1@edusense.edu', 'Student@123')}
              className={`p-2 rounded-lg text-left border transition-all ${
                email === 'student1@edusense.edu'
                  ? 'bg-rose-500/20 border-rose-500/40 text-rose-300'
                  : 'bg-slate-800/60 border-slate-700/60 text-slate-300 hover:bg-slate-700/60'
              }`}
            >
              <div className="font-semibold text-[11px] truncate">Student (High)</div>
              <div className="text-[10px] text-slate-400">Rahul • 58% Att</div>
            </button>

            <button
              type="button"
              onClick={() => setDemoUser('student', 'student2@edusense.edu', 'Student@123')}
              className={`p-2 rounded-lg text-left border transition-all ${
                email === 'student2@edusense.edu'
                  ? 'bg-amber-500/20 border-amber-500/40 text-amber-300'
                  : 'bg-slate-800/60 border-slate-700/60 text-slate-300 hover:bg-slate-700/60'
              }`}
            >
              <div className="font-semibold text-[11px] truncate">Student (Mod)</div>
              <div className="text-[10px] text-slate-400">Priya • 74% Att</div>
            </button>

            <button
              type="button"
              onClick={() => setDemoUser('student', 'student3@edusense.edu', 'Student@123')}
              className={`p-2 rounded-lg text-left border transition-all ${
                email === 'student3@edusense.edu'
                  ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
                  : 'bg-slate-800/60 border-slate-700/60 text-slate-300 hover:bg-slate-700/60'
              }`}
            >
              <div className="font-semibold text-[11px] truncate">Student (Low)</div>
              <div className="text-[10px] text-slate-400">Aarav • 92% Att</div>
            </button>
          </div>

          <div className="grid grid-cols-2 gap-1.5 text-xs pt-1">
            <button
              type="button"
              onClick={() => setDemoUser('faculty', 'faculty@edusense.edu', 'Faculty@123')}
              className={`p-2 rounded-lg text-left border transition-all ${
                email === 'faculty@edusense.edu'
                  ? 'bg-indigo-500/20 border-indigo-500/40 text-indigo-300'
                  : 'bg-slate-800/60 border-slate-700/60 text-slate-300 hover:bg-slate-700/60'
              }`}
            >
              <div className="font-semibold text-[11px]">Faculty</div>
              <div className="text-[10px] text-slate-400">Prof. Sunita Rao</div>
            </button>

            <button
              type="button"
              onClick={() => setDemoUser('admin', 'admin@edusense.edu', 'Admin@123')}
              className={`p-2 rounded-lg text-left border transition-all ${
                email === 'admin@edusense.edu'
                  ? 'bg-purple-500/20 border-purple-500/40 text-purple-300'
                  : 'bg-slate-800/60 border-slate-700/60 text-slate-300 hover:bg-slate-700/60'
              }`}
            >
              <div className="font-semibold text-[11px]">Admin</div>
              <div className="text-[10px] text-slate-400">System Admin</div>
            </button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="subtle-card rounded-2xl p-6 sm:p-8 border border-slate-800 space-y-5">
          {error && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs animate-shake">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {mode === 'register' && (
            <>
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">Full Name</label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Vikas Sharma"
                    className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">Student ID / Roll No</label>
                <input
                  type="text"
                  required
                  value={studentId}
                  onChange={(e) => setStudentId(e.target.value)}
                  placeholder="e.g. EDU2024CS099"
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">Semester</label>
                <select
                  required
                  value={semester}
                  onChange={(e) => setSemester(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-indigo-500"
                >
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((sem) => (
                    <option key={sem} value={sem}>Semester {sem}</option>
                  ))}
                </select>
              </div>
            </>
          )}

          {mode === 'login' && (
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">Continue as</label>
              <select
                value={role}
                onChange={(e: any) => setRole(e.target.value)}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-indigo-500"
              >
                <option value="student">Student Login</option>
                <option value="faculty">Faculty Login</option>
                <option value="admin">Administrator Login</option>
              </select>
              {role !== 'student' && (
                <p className="text-[11px] text-slate-500 mt-1.5">
                  Faculty and administrator accounts are provisioned by authorized administrators.
                </p>
              )}
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">Institutional Email</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@university.edu"
                className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 px-4 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-sm transition-colors shadow-lg shadow-indigo-500/20 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? (
              <span>Authenticating...</span>
            ) : (
              <>
                <span>{mode === 'login' ? 'Sign In' : 'Create Account'}</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>

          <div className="text-center pt-2">
            <button
              type="button"
              onClick={() => {
                setMode(mode === 'login' ? 'register' : 'login');
                setError(null);
              }}
              className="text-xs text-indigo-400 hover:text-indigo-300 underline"
            >
              {mode === 'login' ? "Don't have an account? Register here" : 'Already have an account? Sign in'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
