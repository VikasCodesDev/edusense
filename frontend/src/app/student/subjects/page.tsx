'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import api from '@/lib/api';
import { BookOpen, Calendar, CheckSquare, TrendingDown, TrendingUp, AlertCircle, Sparkles } from 'lucide-react';

export default function SubjectsPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/students/me')
      .then((res) => {
        if (res.data.success) setData(res.data);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="max-w-7xl mx-auto px-4 py-12 animate-pulse"><div className="h-40 bg-slate-800/50 rounded-2xl" /></div>;
  }

  const student = data?.student;
  const hasAcademicData = Boolean(student?.academicDataComplete || (student?.attendancePct !== undefined && student?.internalTestAvg !== undefined && student?.subjects?.length));
  if (!hasAcademicData) {
    return (
      <div className="max-w-xl mx-auto my-16 px-4 text-center space-y-4">
        <h2 className="text-xl font-bold text-white">No Subject Records Yet</h2>
        <p className="text-sm text-slate-400">Add subject-wise marks, attendance, and assignment completion to view diagnostics.</p>
        <Link href="/student/profile" className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium inline-flex">Update Academic Data</Link>
      </div>
    );
  }
  const subjects = student?.subjects || [];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fade-in">
      
      {/* Header */}
      <div>
        <span className="text-xs font-mono uppercase tracking-widest text-indigo-400">Course Registry</span>
        <h1 className="text-2xl sm:text-3xl font-bold text-white mt-1">Enrolled Subjects & Diagnostics</h1>
        <p className="text-xs sm:text-sm text-slate-400">
          Module-level progress, attendance compliance, and subject-specific academic recommendations.
        </p>
      </div>

      {/* Grid of Subject Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {subjects.map((sub: any, idx: number) => {
          const score = sub.score ?? sub.internalScore ?? 0;
          const att = sub.attendance ?? student.attendancePct;
          const comp = sub.assignmentCompletion ?? student.assignmentCompletionRate;
          const isAtRisk = score < 50 || att < 65;

          return (
            <div
              key={idx}
              className={`subtle-card rounded-2xl p-6 border transition-all ${
                isAtRisk ? 'border-rose-500/40 bg-[#16121f]' : 'border-slate-800 hover:border-slate-700'
              } space-y-5`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-indigo-400" />
                    <h3 className="text-base font-bold text-white">{sub.name}</h3>
                  </div>
                  <span className="text-xs text-slate-400">Department of Computer Science • 4 Credits</span>
                </div>
                <span
                  className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                    score >= 75
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                      : score >= 50
                      ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                      : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                  }`}
                >
                  {score >= 75 ? 'Proficient' : score >= 50 ? 'Average' : 'Critical Focus'}
                </span>
              </div>

              {/* Progress Bars */}
              <div className="space-y-3 text-xs">
                <div>
                  <div className="flex justify-between text-slate-400 mb-1">
                    <span>Internal Assessment Marks</span>
                    <span className="font-mono font-bold text-white">{score}%</span>
                  </div>
                  <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${score < 50 ? 'bg-rose-500' : score < 75 ? 'bg-amber-500' : 'bg-indigo-500'}`}
                      style={{ width: `${Math.min(100, Math.max(0, score))}%` }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-slate-400 mb-1">
                    <span>Classroom & Lab Attendance</span>
                    <span className="font-mono font-bold text-white">{att}%</span>
                  </div>
                  <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${att < 75 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                      style={{ width: `${Math.min(100, Math.max(0, att))}%` }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-slate-400 mb-1">
                    <span>Assignment & Lab Completion</span>
                    <span className="font-mono font-bold text-white">{comp}%</span>
                  </div>
                  <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-sky-500"
                      style={{ width: `${Math.min(100, Math.max(0, comp))}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* AI Subject Prescription */}
              <div className="bg-[#0c1322] p-3.5 rounded-xl border border-slate-800/80 text-xs space-y-1">
                <span className="text-[10px] uppercase font-mono text-indigo-400 font-semibold flex items-center gap-1">
                  <Sparkles className="w-3 h-3" />
                  <span>Subject Action Plan</span>
                </span>
                <p className="text-slate-300">
                  {score < 50
                    ? `Review fundamental core concepts in ${sub.name} and attend dedicated tutorial sessions.`
                    : score < 75
                    ? `Solidify problem-solving speed by completing previous years mid-semester question sets.`
                    : `Strong performance. Work on advanced optimization projects and help peers during study sessions.`}
                </p>
              </div>
            </div>
          );
        })}
      </div>

    </div>
  );
}
