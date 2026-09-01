'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import api from '@/lib/api';
import RiskBadge from '@/components/RiskBadge';
import StatCard from '@/components/StatCard';
import TypingText from '@/components/TypingText';
import {
  ArrowLeft,
  BookOpen,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  Sparkles,
  ClipboardList,
  Clock,
  Send,
  User,
  ShieldCheck
} from 'lucide-react';

export default function StudentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const studentId = params.id as string;

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [interventionNote, setInterventionNote] = useState('');
  const [actionTaken, setActionTaken] = useState('');
  const [priority, setPriority] = useState('Medium');
  const [savingIntervention, setSavingIntervention] = useState(false);
  const [interventionSuccess, setInterventionSuccess] = useState(false);

  const fetchStudentData = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/faculty/students/${studentId}`);
      if (res.data.success) {
        setData(res.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (studentId) fetchStudentData();
  }, [studentId]);

  const handleLogIntervention = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!interventionNote.trim()) return;

    try {
      setSavingIntervention(true);
      const res = await api.post('/faculty/interventions', {
        studentId,
        note: interventionNote,
        actionTaken: actionTaken || 'Advisory session completed',
        priority
      });

      if (res.data.success) {
        setInterventionSuccess(true);
        setInterventionNote('');
        setActionTaken('');
        await fetchStudentData();
        setTimeout(() => setInterventionSuccess(false), 3000);
      }
    } catch (err) {
      console.error('Failed to log intervention:', err);
    } finally {
      setSavingIntervention(false);
    }
  };

  if (loading) {
    return <div className="max-w-7xl mx-auto px-4 py-12 animate-pulse space-y-6"><div className="h-40 bg-slate-800/50 rounded-2xl" /></div>;
  }

  if (!data) {
    return (
      <div className="max-w-xl mx-auto my-16 text-center space-y-4">
        <h2 className="text-xl font-bold text-white">Student Not Found</h2>
        <button onClick={() => router.push('/faculty/dashboard')} className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-xs">
          Back to Faculty Dashboard
        </button>
      </div>
    );
  }

  const { student, prediction, recommendation, interventions } = data;
  const subjects = student?.subjects || [];
  const riskLevel = prediction?.risk_level || student?.currentRiskLevel || 'Moderate';
  const riskScore = prediction?.risk_score !== undefined ? prediction.risk_score : student?.currentRiskScore || 50;
  const factors = prediction?.contributing_factors || [];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fade-in">
      
      {/* Navigation & Header */}
      <div className="space-y-4">
        <button
          onClick={() => router.push('/faculty/dashboard')}
          className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Students Directory</span>
        </button>

        <div className="subtle-card rounded-2xl p-6 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center font-bold text-xl">
              {student.name.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold text-white">{student.name}</h1>
                <RiskBadge level={riskLevel} score={riskScore} showScore size="sm" />
              </div>
              <p className="text-xs text-slate-400 font-mono mt-0.5">
                Roll No: {student.studentId} • {student.course} • Sem {student.semester}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-6 text-xs text-slate-400 bg-slate-900/80 p-3.5 rounded-xl border border-slate-800">
            <div>
              <span className="text-slate-500 text-[10px] uppercase font-mono">Attendance</span>
              <p className="font-mono font-bold text-white text-sm">{student.attendancePct}%</p>
            </div>
            <div>
              <span className="text-slate-500 text-[10px] uppercase font-mono">Test Average</span>
              <p className="font-mono font-bold text-white text-sm">{student.internalTestAvg}%</p>
            </div>
            <div>
              <span className="text-slate-500 text-[10px] uppercase font-mono">Trend</span>
              <p className={`font-mono font-bold text-sm ${student.performanceTrend < 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                {student.performanceTrend > 0 ? `+${student.performanceTrend}%` : `${student.performanceTrend}%`}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Grid: ML Diagnosis & Faculty Intervention Plan */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* ML Explainability Indicators */}
        <div className="lg:col-span-2 subtle-card rounded-2xl p-6 border border-slate-800 space-y-6">
          <div className="border-b border-slate-800 pb-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-400" />
              <span>Model Explainability & Contributing Factors</span>
            </h3>
            <p className="text-xs text-slate-400">Indicators identified by the Random Forest classifier</p>
          </div>

          <div className="space-y-3">
            {factors.map((f: any, idx: number) => {
              const isNegative = (f.impact || '').toLowerCase().includes('negative');
              return (
                <div
                  key={idx}
                  className={`p-3.5 rounded-xl border text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2 ${
                    isNegative ? 'bg-rose-500/5 border-rose-500/20' : 'bg-emerald-500/5 border-emerald-500/20'
                  }`}
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2 font-semibold text-white">
                      {isNegative ? <AlertTriangle className="w-3.5 h-3.5 text-rose-400" /> : <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
                      <span>{f.factor}</span>
                    </div>
                    <p className="text-slate-400">{f.description}</p>
                  </div>
                  <div className="sm:text-right font-mono text-[11px] text-slate-300 shrink-0">
                    <div>{f.value}</div>
                    <div className="text-[10px] text-slate-500">{f.benchmark}</div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* AI Guidance Context */}
          {recommendation && (
            <div className="bg-[#0c1322] p-4 rounded-xl border border-indigo-500/20 space-y-2">
              <span className="text-xs font-semibold text-indigo-400 uppercase tracking-wider font-mono">
                AI Suggested Intervention Focus
              </span>
              <p className="text-xs text-slate-300 leading-relaxed">
                {recommendation.immediatePriority}
              </p>
            </div>
          )}

          {/* Subject Roster */}
          <div className="space-y-3 pt-2">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Subject Performance</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {subjects.map((sub: any, idx: number) => (
                <div key={idx} className="p-3 bg-slate-900/60 rounded-xl border border-slate-800 text-xs flex items-center justify-between">
                  <span className="font-medium text-white">{sub.name}</span>
                  <span className="font-mono font-bold text-indigo-400">{sub.score || sub.internalScore}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Faculty Action & Intervention Logger */}
        <div className="subtle-card rounded-2xl p-6 border border-slate-800 space-y-6">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <ClipboardList className="w-4 h-4 text-indigo-400" />
              <span>Log Faculty Intervention</span>
            </h3>
            <p className="text-xs text-slate-400">Record counseling, remedial assignment, or meeting notes</p>
          </div>

          {interventionSuccess && (
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-lg text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              <span>Intervention action recorded successfully.</span>
            </div>
          )}

          <form onSubmit={handleLogIntervention} className="space-y-4 text-xs">
            <div>
              <label className="block text-slate-300 font-medium mb-1.5">Action / Measure Taken</label>
              <input
                type="text"
                required
                value={actionTaken}
                onChange={(e) => setActionTaken(e.target.value)}
                placeholder="e.g. Scheduled DSA remedial tutorial"
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1.5">Counseling Notes & Observations</label>
              <textarea
                required
                rows={4}
                value={interventionNote}
                onChange={(e) => setInterventionNote(e.target.value)}
                placeholder="Details of student discussion, agreed milestones, and specific subject recovery plan..."
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1.5">Priority</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-indigo-500"
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High - Critical Attention</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={savingIntervention}
              className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-medium inline-flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{savingIntervention ? 'Saving...' : 'Save Intervention Record'}</span>
            </button>
          </form>

          {/* Past Interventions */}
          <div className="pt-4 border-t border-slate-800 space-y-3">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Intervention History</h4>
            {interventions && interventions.length > 0 ? (
              <div className="space-y-3">
                {interventions.map((item: any, idx: number) => (
                  <div key={idx} className="p-3 bg-slate-900/60 rounded-xl border border-slate-800 text-xs space-y-1">
                    <div className="flex items-center justify-between font-semibold text-white">
                      <span>{item.actionTaken}</span>
                      <span className="text-[10px] text-slate-500 font-mono">{item.createdAt?.split('T')[0]}</span>
                    </div>
                    <p className="text-slate-400">{item.note}</p>
                    <div className="text-[10px] text-indigo-400">By {item.facultyName}</div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-500">No prior interventions logged yet.</p>
            )}
          </div>
        </div>

      </div>

    </div>
  );
}
