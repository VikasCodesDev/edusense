'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import RiskBadge from '@/components/RiskBadge';
import StatCard from '@/components/StatCard';
import TypingText from '@/components/TypingText';
import api from '@/lib/api';
import {
  Calendar,
  CheckCircle2,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Sparkles,
  BookOpen,
  ArrowRight,
  RefreshCw,
  Volume2,
  VolumeX,
  Target,
  Flame,
  Award,
  Layers,
  HelpCircle
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar
} from 'recharts';

export default function StudentDashboard() {
  const { user } = useAuth();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get('/students/me');
      if (res.data && res.data.success) {
        setData(res.data);
      } else {
        setError('Failed to load academic records.');
      }
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'Error connecting to EduSense services.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleSpeakGuidance = (text: string) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.95;
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    setIsSpeaking(true);
    window.speechSynthesis.speak(utterance);
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8 animate-pulse">
        <div className="h-28 bg-slate-800/50 rounded-2xl" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 bg-slate-800/50 rounded-xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 h-80 bg-slate-800/50 rounded-2xl" />
          <div className="h-80 bg-slate-800/50 rounded-2xl" />
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="max-w-xl mx-auto my-16 px-4 text-center space-y-4">
        <div className="w-12 h-12 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center mx-auto">
          <AlertTriangle className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-bold text-white">Unable to Load Student Record</h2>
        <p className="text-sm text-slate-400">{error || 'Please ensure you are signed in with a valid student profile.'}</p>
        <button
          onClick={fetchProfile}
          className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium inline-flex items-center gap-2"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Retry</span>
        </button>
      </div>
    );
  }

  const { student, prediction, recommendation, progressHistory } = data;
  const hasAcademicData = Boolean(student?.academicDataComplete || (student?.attendancePct !== undefined && student?.internalTestAvg !== undefined && student?.subjects?.length));
  if (!hasAcademicData) {
    return (
      <div className="max-w-xl mx-auto my-16 px-4 text-center space-y-4">
        <div className="w-12 h-12 rounded-xl bg-indigo-600/20 text-indigo-400 flex items-center justify-center mx-auto">
          <BookOpen className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-bold text-white">Academic Data Required</h2>
        <p className="text-sm text-slate-400">Enter your attendance, marks, assignments, and subject records to generate your dashboard and ML risk analysis.</p>
        <Link href="/student/profile" className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium inline-flex items-center gap-2">
          <span>Update Academic Data</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    );
  }
  const subjects = student.subjects || [];
  const riskLevel = prediction?.risk_level || student.currentRiskLevel || 'Moderate';
  const riskScore = prediction?.risk_score !== undefined ? prediction.risk_score : (student.currentRiskScore ?? 0);

  // Chart data from progress history or fallback
  const chartData = (progressHistory && progressHistory.length > 0)
    ? progressHistory.map((p: any) => ({
        cycle: p.evaluationCycle ? p.evaluationCycle.split(' - ')[0] : 'Cycle',
        attendance: p.attendance,
        marks: p.internalMarks,
        risk: p.riskScore
      }))
    : [{ cycle: 'Current', attendance: student.attendancePct, marks: student.internalTestAvg, risk: riskScore }];

  const weakSubjects = subjects.filter((s: any) => (s.score ?? s.internalScore) < 55);
  const strongSubjects = subjects.filter((s: any) => (s.score ?? s.internalScore) >= 75);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fade-in">
      
      {/* 1. WELCOME BANNER & ACADEMIC RISK CARD */}
      <div className="subtle-card rounded-2xl p-6 sm:p-8 border border-slate-800 bg-gradient-to-r from-[#101827] via-[#0f172a] to-[#151f33] relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs font-mono text-indigo-400">
              <span>{student.course}</span>
              <span>•</span>
              <span>Semester {student.semester}</span>
              <span>•</span>
              <span className="text-slate-400">ID: {student.studentId}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              Welcome back, {student.name}
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 max-w-xl">
              EduSense AI continuously monitors your attendance, continuous assessments, and coursework trajectories to provide early intervention insights.
            </p>
          </div>

          {/* Academic Risk Banner Badge */}
          <div className="bg-[#0b101c]/80 backdrop-blur-sm p-4 rounded-xl border border-slate-700/80 shrink-0 min-w-[260px] space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] uppercase font-mono tracking-wider text-slate-400">Potential Academic Risk</span>
              <RiskBadge level={riskLevel} score={riskScore} showScore size="sm" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold font-mono text-white">{riskScore}</span>
              <span className="text-xs text-slate-400 font-mono">/ 100 Risk Index</span>
            </div>
            <p className="text-[11px] text-slate-400">
              Confidence: {prediction?.confidence_percentage || 94}% • Model: {prediction?.model_algorithm || 'Random Forest'}
            </p>
          </div>
        </div>
      </div>

      {/* 2. CORE KPI METRICS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Lecture & Lab Attendance"
          value={`${student.attendancePct}%`}
          progress={student.attendancePct}
          subtitle={student.attendancePct < 75 ? 'Shortage (Req: 75%)' : 'In good standing'}
          color={student.attendancePct < 65 ? 'rose' : student.attendancePct < 75 ? 'amber' : 'emerald'}
          icon={Calendar}
        />

        <StatCard
          title="Internal Assessment Avg"
          value={`${student.internalTestAvg}%`}
          progress={student.internalTestAvg}
          subtitle="Continuous Test Average"
          color={student.internalTestAvg < 45 ? 'rose' : student.internalTestAvg < 60 ? 'amber' : 'emerald'}
          trend={student.performanceTrend}
          trendLabel="Recent Delta"
          icon={Target}
        />

        <StatCard
          title="Assignment Submission Rate"
          value={`${student.assignmentCompletionRate}%`}
          progress={student.assignmentCompletionRate}
          subtitle="Coursework completion"
          color={student.assignmentCompletionRate < 60 ? 'rose' : 'indigo'}
          icon={CheckCircle2}
        />

        <StatCard
          title="Previous Exam Baseline"
          value={`${student.previousExamScore}%`}
          progress={student.previousExamScore}
          subtitle="Prior semester average"
          color="blue"
          icon={Award}
        />
      </div>

      {/* 3. AI GUIDANCE & PERSONALIZED LEARNING PLAN */}
      {recommendation && (
        <div className="subtle-card rounded-2xl p-6 sm:p-8 border border-indigo-500/30 bg-[#0d1424] space-y-6 relative overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-600/20 text-indigo-400 flex items-center justify-center border border-indigo-500/30">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-bold text-white">Personalized AI Academic Guidance</h2>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-mono">
                    {recommendation.source === 'ai_groq' ? 'LLM LLaMA 3.3' : 'Deterministic Rules'}
                  </span>
                </div>
                <p className="text-xs text-slate-400">Contextual advice customized to your weak subjects and attendance trend</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => handleSpeakGuidance(`${recommendation.immediatePriority}. Suggested routine: ${recommendation.suggestedWeeklyRoutine}`)}
                className="px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 flex items-center gap-1.5 transition-colors"
              >
                {isSpeaking ? <VolumeX className="w-3.5 h-3.5 text-rose-400" /> : <Volume2 className="w-3.5 h-3.5 text-indigo-400" />}
                <span>{isSpeaking ? 'Stop Audio' : 'Listen Guidance'}</span>
              </button>
              <Link
                href="/student/recommendations"
                className="px-3 py-1.5 rounded-lg text-xs font-medium bg-indigo-600 hover:bg-indigo-500 text-white flex items-center gap-1 transition-colors"
              >
                <span>Full Study Plan</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {/* Immediate Priority Box */}
          <div className="bg-indigo-950/30 p-4 rounded-xl border border-indigo-500/20 space-y-1">
            <span className="text-[10px] font-mono uppercase tracking-widest text-indigo-400 font-bold">
              Immediate Priority Focus
            </span>
            <p className="text-sm text-slate-200 font-medium leading-relaxed">
              <TypingText text={recommendation.immediatePriority} speed={12} />
            </p>
          </div>

          {/* Structured Guidance Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Study Focus */}
            <div className="bg-[#101726] p-4 rounded-xl border border-slate-800 space-y-2">
              <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5 text-indigo-400" />
                <span>Subject Study Focus</span>
              </span>
              <ul className="space-y-1.5 text-xs text-slate-400">
                {Array.isArray(recommendation.studyFocus) ? (
                  recommendation.studyFocus.map((item: string, idx: number) => (
                    <li key={idx} className="flex items-start gap-1.5">
                      <span className="text-indigo-400 font-mono text-[10px] mt-0.5">•</span>
                      <span>{item}</span>
                    </li>
                  ))
                ) : (
                  <li>{recommendation.studyFocus}</li>
                )}
              </ul>
            </div>

            {/* Attendance & Routine */}
            <div className="bg-[#101726] p-4 rounded-xl border border-slate-800 space-y-2">
              <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-emerald-400" />
                <span>Attendance & Routine</span>
              </span>
              <p className="text-xs text-slate-400 leading-relaxed">
                {recommendation.attendanceStrategy || 'Maintain consistent presence across lecture & lab sessions.'}
              </p>
              <div className="pt-2 border-t border-slate-800/80 text-[11px] text-indigo-300">
                <span className="font-medium">Routine: </span>
                {recommendation.suggestedWeeklyRoutine}
              </div>
            </div>

            {/* Assignments & Momentum */}
            <div className="bg-[#101726] p-4 rounded-xl border border-slate-800 space-y-2">
              <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <Flame className="w-3.5 h-3.5 text-amber-400" />
                <span>Assignments & Encouragement</span>
              </span>
              <p className="text-xs text-slate-400 leading-relaxed">
                {recommendation.assignmentActionPlan || 'Submit all pending lab problem sets.'}
              </p>
              <div className="pt-2 border-t border-slate-800/80 text-[11px] text-slate-400 italic">
                &quot;{recommendation.motivationalNote}&quot;
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 4. DUAL SECTION: PERFORMANCE TRAJECTORY CHART & SUBJECT CARDS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Trajectory Area Chart */}
        <div className="lg:col-span-2 subtle-card rounded-2xl p-6 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-white">Performance Trajectory</h3>
              <p className="text-xs text-slate-400">Temporal evaluation cycles vs Academic Risk index</p>
            </div>
            <Link href="/student/progress" className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1">
              <span>View History</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="h-64 w-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorMarks" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorAtt" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="cycle" stroke="#64748b" fontSize={11} />
                <YAxis stroke="#64748b" fontSize={11} domain={[0, 100]} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }}
                />
                <Area type="monotone" dataKey="marks" stroke="#6366f1" fillOpacity={1} fill="url(#colorMarks)" name="Internal Marks %" />
                <Area type="monotone" dataKey="attendance" stroke="#10b981" fillOpacity={1} fill="url(#colorAtt)" name="Attendance %" />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="flex items-center justify-center gap-6 text-xs text-slate-400 pt-2 border-t border-slate-800">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-indigo-500" />
              <span>Assessment Marks</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-emerald-500" />
              <span>Attendance %</span>
            </div>
          </div>
        </div>

        {/* Strengths & Weak Areas Callout */}
        <div className="subtle-card rounded-2xl p-6 border border-slate-800 space-y-6">
          <div>
            <h3 className="text-base font-bold text-white">Academic Diagnostics</h3>
            <p className="text-xs text-slate-400">Identified weak areas and key competencies</p>
          </div>

          {/* Weak Areas */}
          <div className="space-y-2.5">
            <span className="text-xs font-semibold uppercase tracking-wider text-rose-400 flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Areas Requiring Attention</span>
            </span>
            {weakSubjects.length > 0 ? (
              <div className="space-y-2">
                {weakSubjects.map((s: any, idx: number) => (
                  <div key={idx} className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-xs text-slate-200">
                    <div className="flex justify-between font-medium">
                      <span>{s.name}</span>
                      <span className="text-rose-400 font-mono">{s.score}%</span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5">Below passing threshold (50%) • Trend: {s.trend}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-3 rounded-lg bg-slate-800/60 text-xs text-slate-400">
                No subjects currently below critical threshold.
              </div>
            )}
          </div>

          {/* Strengths */}
          <div className="space-y-2.5 pt-2 border-t border-slate-800">
            <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Demonstrated Strengths</span>
            </span>
            {strongSubjects.length > 0 ? (
              <div className="space-y-2">
                {strongSubjects.map((s: any, idx: number) => (
                  <div key={idx} className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-xs text-slate-200">
                    <div className="flex justify-between font-medium">
                      <span>{s.name}</span>
                      <span className="text-emerald-400 font-mono">{s.score}%</span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5">High proficiency • Trend: {s.trend}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-3 rounded-lg bg-slate-800/60 text-xs text-slate-400">
                Maintain balance across core subjects to build top strengths.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 5. SUBJECT-WISE BREAKDOWN CARDS */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-white">Enrolled Subjects Overview</h3>
            <p className="text-xs text-slate-400">Subject-specific performance, attendance and completion indicators</p>
          </div>
          <Link href="/student/subjects" className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1">
            <span>Detailed Subject Analysis</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {subjects.map((sub: any, idx: number) => {
            const score = sub.score ?? sub.internalScore ?? 0;
            const att = sub.attendance ?? student.attendancePct;
            const isWeak = score < 50 || att < 65;

            return (
              <div key={idx} className="subtle-card rounded-xl p-5 border border-slate-800 space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-semibold text-sm text-white">{sub.name}</h4>
                    <span className="text-[11px] text-slate-400">Course Code: CS{300 + idx}</span>
                  </div>
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded font-mono ${
                      sub.trend === 'improving'
                        ? 'bg-emerald-500/10 text-emerald-400'
                        : sub.trend === 'declining'
                        ? 'bg-rose-500/10 text-rose-400'
                        : 'bg-slate-700 text-slate-300'
                    }`}
                  >
                    {sub.trend || 'stable'}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-slate-800">
                  <div>
                    <span className="text-slate-400 text-[11px]">Marks:</span>
                    <p className={`font-mono font-bold ${score < 50 ? 'text-rose-400' : 'text-slate-200'}`}>
                      {score}%
                    </p>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[11px]">Attendance:</span>
                    <p className={`font-mono font-bold ${att < 75 ? 'text-amber-400' : 'text-slate-200'}`}>
                      {att}%
                    </p>
                  </div>
                </div>

                <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${score < 50 ? 'bg-rose-500' : score < 75 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                    style={{ width: `${Math.min(100, Math.max(0, score))}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
}
