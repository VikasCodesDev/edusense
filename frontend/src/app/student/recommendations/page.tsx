'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import api from '@/lib/api';
import TypingText from '@/components/TypingText';
import {
  Sparkles,
  BookOpen,
  Calendar,
  Flame,
  CheckCircle2,
  RefreshCw,
  Printer,
  Compass,
  ArrowRight
} from 'lucide-react';

export default function RecommendationsPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [regenerating, setRegenerating] = useState(false);

  const fetchData = async () => {
    try {
      const res = await api.get('/students/me');
      if (res.data.success) setData(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleRegenerate = async () => {
    try {
      setRegenerating(true);
      const res = await api.post('/students/me/recommendations/generate', {});
      if (res.data.success) {
        await fetchData();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setRegenerating(false);
    }
  };

  if (loading) {
    return <div className="max-w-7xl mx-auto px-4 py-12 animate-pulse space-y-6"><div className="h-60 bg-slate-800/50 rounded-2xl" /></div>;
  }

  const rec = data?.recommendation;
  const student = data?.student;
  const hasAcademicData = Boolean(student?.academicDataComplete || (student?.attendancePct !== undefined && student?.internalTestAvg !== undefined && student?.subjects?.length));
  if (!hasAcademicData) {
    return (
      <div className="max-w-xl mx-auto my-16 px-4 text-center space-y-4">
        <h2 className="text-xl font-bold text-white">Guidance Not Available Yet</h2>
        <p className="text-sm text-slate-400">Enter your academic data to generate personalized recommendations.</p>
        <Link href="/student/profile" className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium inline-flex">Update Academic Data</Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fade-in">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-mono uppercase tracking-widest text-indigo-400">AI Academic Advisor</span>
          <h1 className="text-2xl sm:text-3xl font-bold text-white mt-1">Personalized Improvement Plan</h1>
          <p className="text-xs sm:text-sm text-slate-400">
            Actionable strategies tailored to your exact academic indicators and attendance pattern.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => window.print()}
            className="px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium inline-flex items-center gap-1.5 border border-slate-700 transition-colors"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Plan</span>
          </button>
          <button
            onClick={handleRegenerate}
            disabled={regenerating}
            className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium inline-flex items-center gap-1.5 shadow-sm transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${regenerating ? 'animate-spin' : ''}`} />
            <span>{regenerating ? 'Regenerating AI...' : 'Regenerate Plan'}</span>
          </button>
        </div>
      </div>

      {rec ? (
        <div className="space-y-6">
          
          {/* Priority Callout */}
          <div className="subtle-card rounded-2xl p-6 sm:p-8 border border-indigo-500/40 bg-gradient-to-br from-[#121a2d] to-[#0c1220] space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono uppercase tracking-wider text-indigo-400 font-bold flex items-center gap-2">
                <Sparkles className="w-4 h-4" />
                <span>Immediate Priority Focus</span>
              </span>
              <span className="text-[11px] font-mono text-slate-500">
                Source: {rec.source === 'ai_groq' ? 'Groq LLaMA 3.3 Engine' : 'Deterministic Guidance System'}
              </span>
            </div>
            <p className="text-base sm:text-lg font-medium text-white leading-relaxed">
              <TypingText text={rec.immediatePriority} speed={10} />
            </p>
          </div>

          {/* Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Subject Study Roadmap */}
            <div className="subtle-card rounded-2xl p-6 border border-slate-800 space-y-4">
              <div className="flex items-center gap-2 text-white font-bold text-base">
                <BookOpen className="w-5 h-5 text-indigo-400" />
                <h3>Subject-Specific Focus Areas</h3>
              </div>
              <ul className="space-y-3 text-xs text-slate-300">
                {Array.isArray(rec.studyFocus) ? (
                  rec.studyFocus.map((item: string, idx: number) => (
                    <li key={idx} className="flex items-start gap-2.5 p-3 rounded-lg bg-slate-900/60 border border-slate-800">
                      <CheckCircle2 className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                      <span>{item}</span>
                    </li>
                  ))
                ) : (
                  <li className="p-3 rounded-lg bg-slate-900/60">{rec.studyFocus}</li>
                )}
              </ul>
            </div>

            {/* Attendance Strategy */}
            <div className="subtle-card rounded-2xl p-6 border border-slate-800 space-y-4">
              <div className="flex items-center gap-2 text-white font-bold text-base">
                <Calendar className="w-5 h-5 text-emerald-400" />
                <h3>Attendance Recovery Strategy</h3>
              </div>
              <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 text-xs text-slate-300 space-y-3">
                <p className="leading-relaxed">{rec.attendanceStrategy}</p>
                <div className="pt-2 border-t border-slate-800 text-[11px] text-emerald-400 font-mono">
                  Institutional Requirement: Minimum 75% lecture & lab attendance
                </div>
              </div>
            </div>

            {/* Assignment Action Plan */}
            <div className="subtle-card rounded-2xl p-6 border border-slate-800 space-y-4">
              <div className="flex items-center gap-2 text-white font-bold text-base">
                <Flame className="w-5 h-5 text-amber-400" />
                <h3>Assignments & Coursework Roadmap</h3>
              </div>
              <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 text-xs text-slate-300 space-y-3">
                <p className="leading-relaxed">{rec.assignmentActionPlan}</p>
                <div className="pt-2 border-t border-slate-800 text-[11px] text-slate-400">
                  Target: 100% submission compliance across active course modules
                </div>
              </div>
            </div>

            {/* Suggested Weekly Routine */}
            <div className="subtle-card rounded-2xl p-6 border border-slate-800 space-y-4">
              <div className="flex items-center gap-2 text-white font-bold text-base">
                <Compass className="w-5 h-5 text-sky-400" />
                <h3>Recommended Daily Routine</h3>
              </div>
              <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 text-xs text-slate-300 space-y-3">
                <p className="leading-relaxed font-mono text-indigo-300">{rec.suggestedWeeklyRoutine}</p>
                <div className="pt-2 border-t border-slate-800 text-[11px] text-slate-400 italic">
                  &quot;{rec.motivationalNote}&quot;
                </div>
              </div>
            </div>

          </div>

        </div>
      ) : (
        <div className="text-center py-12 text-slate-400 text-xs">No recommendations generated yet.</div>
      )}

    </div>
  );
}
