'use client';

import React from 'react';
import { useAuth } from '@/context/AuthContext';
import { User, Mail, GraduationCap, Building, Shield, CheckCircle2 } from 'lucide-react';
import RiskBadge from '@/components/RiskBadge';

export default function ProfilePage() {
  const { user, studentData } = useAuth();

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fade-in">
      <div>
        <span className="text-xs font-mono uppercase tracking-widest text-indigo-400">Institutional Identity</span>
        <h1 className="text-2xl sm:text-3xl font-bold text-white mt-1">Student Academic Profile</h1>
        <p className="text-xs sm:text-sm text-slate-400">
          Enrolled program details and academic identity attributes.
        </p>
      </div>

      <div className="subtle-card rounded-2xl p-6 sm:p-8 border border-slate-800 space-y-6">
        <div className="flex items-center gap-4 border-b border-slate-800 pb-6">
          <div className="w-16 h-16 rounded-2xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center font-bold text-xl">
            {user?.name ? user.name.charAt(0) : 'S'}
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-bold text-white">{user?.name}</h2>
              {studentData && <RiskBadge level={studentData.currentRiskLevel} score={studentData.currentRiskScore} size="sm" />}
            </div>
            <p className="text-xs text-slate-400 font-mono mt-0.5">ID: {studentData?.studentId || user?.studentId || 'EDU2024CS001'}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs">
          <div className="space-y-1 bg-slate-900/60 p-4 rounded-xl border border-slate-800">
            <span className="text-slate-400 flex items-center gap-1.5 font-medium">
              <Mail className="w-4 h-4 text-indigo-400" />
              <span>Email Address</span>
            </span>
            <p className="text-sm font-semibold text-white">{user?.email}</p>
          </div>

          <div className="space-y-1 bg-slate-900/60 p-4 rounded-xl border border-slate-800">
            <span className="text-slate-400 flex items-center gap-1.5 font-medium">
              <GraduationCap className="w-4 h-4 text-indigo-400" />
              <span>Enrolled Degree Program</span>
            </span>
            <p className="text-sm font-semibold text-white">{studentData?.course || 'B.Tech Computer Science'}</p>
          </div>

          <div className="space-y-1 bg-slate-900/60 p-4 rounded-xl border border-slate-800">
            <span className="text-slate-400 flex items-center gap-1.5 font-medium">
              <Building className="w-4 h-4 text-indigo-400" />
              <span>Academic Department</span>
            </span>
            <p className="text-sm font-semibold text-white">{studentData?.department || 'Computer Science & Engineering'}</p>
          </div>

          <div className="space-y-1 bg-slate-900/60 p-4 rounded-xl border border-slate-800">
            <span className="text-slate-400 flex items-center gap-1.5 font-medium">
              <Shield className="w-4 h-4 text-indigo-400" />
              <span>Current Semester</span>
            </span>
            <p className="text-sm font-semibold text-white">Semester {studentData?.semester || 4}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
