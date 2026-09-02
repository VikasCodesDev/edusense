'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import MagneticButton from '@/components/MagneticButton';
import RiskBadge from '@/components/RiskBadge';
import {
  GraduationCap,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Cpu,
  Brain,
  Activity,
  CheckCircle2,
  AlertTriangle,
  TrendingDown,
  TrendingUp,
  BarChart2,
  FileSpreadsheet,
  Users,
  Compass
} from 'lucide-react';

export default function LandingPage() {
  const { user, switchDemoAccount } = useAuth();

  // Interactive Live Simulator state
  const [simAttendance, setSimAttendance] = useState(62);
  const [simAssignments, setSimAssignments] = useState(50);
  const [simInternal, setSimInternal] = useState(48);
  const [simTrend, setSimTrend] = useState(-12);

  // Compute simulated risk dynamically
  const calculateSimulatedRisk = () => {
    let score = 0;
    if (simAttendance < 60) score += 35;
    else if (simAttendance < 75) score += 18;

    if (simInternal < 45) score += 35;
    else if (simInternal < 60) score += 20;

    if (simAssignments < 60) score += 15;
    if (simTrend < -8) score += 20;

    const finalScore = Math.min(100, Math.max(5, score));
    let level = 'Low';
    if (finalScore >= 60 || simAttendance < 60 || simInternal < 42) level = 'High';
    else if (finalScore >= 35 || simAttendance < 75 || simInternal < 55) level = 'Moderate';

    return { level, score: finalScore };
  };

  const simRisk = calculateSimulatedRisk();

  return (
    <div className="space-y-24">
      {/* 1. HERO SECTION */}
      <section className="relative pt-12 sm:pt-20 pb-16 overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-950/40 via-background to-background" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-8">
          
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-medium animate-fade-in">
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI-Powered Academic Intelligence & Early Risk Prediction</span>
          </div>

          {/* Main Hero Heading */}
          <div className="max-w-4xl mx-auto space-y-4">
            <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white leading-tight">
              Identify academic risk earlier.{' '}
                Understand what affects performance.{' '}
              Get personalized guidance.
            </h1>
            <p className="text-base sm:text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed">
              EduSense combines attendance, continuous assessments, assignment completion, and temporal performance trends into a multi-model ML risk predictor paired with LLM-guided academic intervention.
            </p>
          </div>

          {/* Action CTAs */}
          <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
            {user ? (
              <Link href={user.role === 'student' ? '/student/dashboard' : user.role === 'faculty' ? '/faculty/dashboard' : '/admin/dashboard'}>
                <MagneticButton variant="primary" className="text-base px-6 py-3">
                  <span>Enter My Dashboard ({user.role})</span>
                  <ArrowRight className="w-4 h-4 ml-2" />
                </MagneticButton>
              </Link>
            ) : (
              <>
                <Link href="/login">
                  <MagneticButton variant="primary" className="text-base px-6 py-3">
                    <span>Explore Platform Demo</span>
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </MagneticButton>
                </Link>
                <button
                  onClick={() => switchDemoAccount('student', 'student1@edusense.edu')}
                  className="px-5 py-3 rounded-lg text-sm font-medium bg-slate-800/90 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
                >
                  Quick Launch: High Risk Student
                </button>
                <button
                  onClick={() => switchDemoAccount('faculty')}
                  className="px-5 py-3 rounded-lg text-sm font-medium bg-slate-800/90 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
                >
                  Quick Launch: Faculty
                </button>
              </>
            )}
          </div>

          {/* Trust points */}
          <div className="pt-6 flex flex-wrap items-center justify-center gap-8 text-xs text-slate-400">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>SciKit-Learn Random Forest & 4-Model Benchmark</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Groq LLaMA 3.3 Personalized Guidance Engine</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Real CSV/Excel Institutional Data Ingestion</span>
            </div>
          </div>
        </div>
      </section>

      {/* 2. INTERACTIVE RISK SIMULATOR */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="subtle-card rounded-2xl p-6 sm:p-10 border border-indigo-500/20 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-72 h-72 bg-indigo-600/10 rounded-full blur-3xl -z-10" />

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-slate-800 pb-6 mb-8">
            <div>
              <span className="text-xs font-mono uppercase tracking-widest text-indigo-400">Live Interactive Model Simulation</span>
              <h2 className="text-2xl sm:text-3xl font-bold text-white mt-1">
                Experience Academic Risk Prediction
              </h2>
              <p className="text-sm text-slate-400 mt-1">
                Adjust academic indicators below to see how EduSense evaluates potential academic risk and computes contributing factors.
              </p>
            </div>
            <div className="flex items-center gap-3 bg-[#0d1422] px-4 py-3 rounded-xl border border-slate-800">
              <div className="text-right">
                <p className="text-[11px] uppercase font-mono text-slate-400">Simulated Prediction</p>
                <div className="mt-0.5">
                  <RiskBadge level={simRisk.level} score={simRisk.score} showScore size="lg" />
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            {/* Sliders */}
            <div className="space-y-6">
              {/* Attendance */}
              <div>
                <div className="flex justify-between text-xs font-medium text-slate-300 mb-2">
                  <span>Lecture & Lab Attendance</span>
                  <span className="font-mono text-indigo-400 font-bold">{simAttendance}%</span>
                </div>
                <input
                  type="range"
                  min="20"
                  max="100"
                  value={simAttendance}
                  onChange={(e) => setSimAttendance(Number(e.target.value))}
                  className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                />
                <div className="flex justify-between text-[10px] text-slate-500 mt-1">
                  <span>Critical (&lt;60%)</span>
                  <span>Minimum (75%)</span>
                  <span>Optimal (90%+)</span>
                </div>
              </div>

              {/* Assignment Completion */}
              <div>
                <div className="flex justify-between text-xs font-medium text-slate-300 mb-2">
                  <span>Assignment Submission Rate</span>
                  <span className="font-mono text-indigo-400 font-bold">{simAssignments}%</span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="100"
                  value={simAssignments}
                  onChange={(e) => setSimAssignments(Number(e.target.value))}
                  className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                />
              </div>

              {/* Internal Marks */}
              <div>
                <div className="flex justify-between text-xs font-medium text-slate-300 mb-2">
                  <span>Internal Continuous Assessment Average</span>
                  <span className="font-mono text-indigo-400 font-bold">{simInternal}%</span>
                </div>
                <input
                  type="range"
                  min="15"
                  max="100"
                  value={simInternal}
                  onChange={(e) => setSimInternal(Number(e.target.value))}
                  className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                />
              </div>

              {/* Recent Trend */}
              <div>
                <div className="flex justify-between text-xs font-medium text-slate-300 mb-2">
                  <span>Recent Assessment Trend (Delta)</span>
                  <span className={`font-mono font-bold ${simTrend < 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                    {simTrend > 0 ? `+${simTrend}%` : `${simTrend}%`}
                  </span>
                </div>
                <input
                  type="range"
                  min="-30"
                  max="20"
                  value={simTrend}
                  onChange={(e) => setSimTrend(Number(e.target.value))}
                  className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                />
              </div>
            </div>

            {/* Simulated AI Output Card */}
            <div className="bg-[#0b101c] p-6 rounded-xl border border-slate-800 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                  ML Risk Diagnosis & Key Factors
                </span>
                <span className="text-[11px] font-mono text-slate-500">Model: Random Forest</span>
              </div>

              <div className="space-y-3">
                {simAttendance < 65 && (
                  <div className="flex items-start gap-2.5 text-xs text-rose-300 bg-rose-500/10 p-2.5 rounded-lg border border-rose-500/20">
                    <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold">Attendance Shortage ({simAttendance}%):</span> Attendance is below institutional minimum (75%), heavily weighting risk probability.
                    </div>
                  </div>
                )}

                {simTrend < -6 && (
                  <div className="flex items-start gap-2.5 text-xs text-amber-300 bg-amber-500/10 p-2.5 rounded-lg border border-amber-500/20">
                    <TrendingDown className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold">Declining Momentum ({simTrend}%):</span> Assessment marks are steadily dropping across recent testing intervals.
                    </div>
                  </div>
                )}

                {simInternal < 50 && (
                  <div className="flex items-start gap-2.5 text-xs text-rose-300 bg-rose-500/10 p-2.5 rounded-lg border border-rose-500/20">
                    <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold">Assessment Vulnerability ({simInternal}%):</span> Continuous assessment average indicates potential end-term failure without intervention.
                    </div>
                  </div>
                )}

                {simAttendance >= 75 && simInternal >= 60 && simTrend >= 0 && (
                  <div className="flex items-start gap-2.5 text-xs text-emerald-300 bg-emerald-500/10 p-2.5 rounded-lg border border-emerald-500/20">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold">Healthy Standing:</span> Attendance and marks indicate balanced academic progress.
                    </div>
                  </div>
                )}
              </div>

              <div className="pt-2 border-t border-slate-800">
                <p className="text-[11px] text-slate-400 italic">
                  &quot;Responsible Academic Language: EduSense indicates potential academic risk to empower early intervention, never claiming absolute future certainty.&quot;
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. CORE ARCHITECTURE & THE DUAL AI ENGINE */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        <div className="text-center space-y-3">
          <span className="text-xs font-mono uppercase tracking-widest text-indigo-400">Architectural Distinction</span>
          <h2 className="text-3xl font-bold text-white">How EduSense Solves Academic Risk</h2>
          <p className="text-sm text-slate-400 max-w-2xl mx-auto">
            Clear separation between Machine Learning (quantitative risk prediction) and Generative LLM (contextual personalized guidance).
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* ML Card */}
          <div className="subtle-card rounded-2xl p-8 border border-slate-800 hover:border-indigo-500/40 transition-colors space-y-6">
            <div className="w-12 h-12 rounded-xl bg-indigo-600/20 text-indigo-400 flex items-center justify-center border border-indigo-500/30">
              <Cpu className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs font-mono uppercase tracking-wider text-indigo-400">Core Brain 01</span>
              <h3 className="text-xl font-bold text-white mt-1">Machine Learning Risk Prediction</h3>
              <p className="text-sm text-slate-400 mt-2 leading-relaxed">
                Evaluates structured numerical academic records using trained scikit-learn classifiers (Random Forest, Gradient Boosting, Logistic Regression, Decision Tree) with 5-Fold Stratified Cross-Validation.
              </p>
            </div>
            <ul className="space-y-2.5 text-xs text-slate-300">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Multi-factor correlation (Attendance + Marks + Trend + Backlogs)</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>High-Risk Recall prioritization (minimizing false negatives)</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Feature Importance & dynamic explainable indicators</span>
              </li>
            </ul>
          </div>

          {/* LLM Card */}
          <div className="subtle-card rounded-2xl p-8 border border-slate-800 hover:border-purple-500/40 transition-colors space-y-6">
            <div className="w-12 h-12 rounded-xl bg-purple-600/20 text-purple-400 flex items-center justify-center border border-purple-500/30">
              <Brain className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs font-mono uppercase tracking-wider text-purple-400">Core Brain 02</span>
              <h3 className="text-xl font-bold text-white mt-1">LLM Personalized Guidance</h3>
              <p className="text-sm text-slate-400 mt-2 leading-relaxed">
                Receives structured academic diagnosis from the ML engine and generates actionable, structured improvement plans using Groq LLaMA 3.3, with automatic deterministic fallback.
              </p>
            </div>
            <ul className="space-y-2.5 text-xs text-slate-300">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Immediate Priority & Subject-Specific Study Focus</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Attendance Recovery Strategy & Assignment Action Plans</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Zero Hallucination: strictly bounded to actual course data</span>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* 4. PLATFORM ROLES SHOWCASE */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        <div className="text-center space-y-3">
          <span className="text-xs font-mono uppercase tracking-widest text-indigo-400">Role-Based Intelligence</span>
          <h2 className="text-3xl font-bold text-white">Built for the Entire Academic Ecosystem</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Student */}
          <div className="subtle-card rounded-xl p-6 border border-slate-800 space-y-4">
            <div className="p-3 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 w-fit">
              <GraduationCap className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-white">For Students</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Understand personal academic trajectory without guesswork. View subject-by-subject standing, explore risk factors, and follow actionable study routines.
            </p>
            <button
              onClick={() => switchDemoAccount('student', 'student1@edusense.edu')}
              className="text-xs font-medium text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
            >
              <span>Launch Student View</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Faculty */}
          <div className="subtle-card rounded-xl p-6 border border-slate-800 space-y-4">
            <div className="p-3 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 w-fit">
              <Users className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-white">For Faculty</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Monitor class risk distribution, identify students requiring early attention, inspect decline patterns, and log customized academic counseling actions.
            </p>
            <button
              onClick={() => switchDemoAccount('faculty')}
              className="text-xs font-medium text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
            >
              <span>Launch Faculty View</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Admin */}
          <div className="subtle-card rounded-xl p-6 border border-slate-800 space-y-4">
            <div className="p-3 rounded-lg bg-purple-500/10 text-purple-400 border border-purple-500/20 w-fit">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-white">For Institutional Admin</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Ingest institutional CSV/Excel datasets with automated validation and column mapping. Inspect ML model benchmarks and trigger retraining.
            </p>
            <button
              onClick={() => switchDemoAccount('admin')}
              className="text-xs font-medium text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
            >
              <span>Launch Admin Hub</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </section>

      {/* 5. PRIVACY, SECURITY & SDG 4 */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="subtle-card rounded-2xl p-8 border border-slate-800 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="space-y-3 max-w-xl">
            <div className="inline-flex items-center gap-2 text-xs font-mono text-emerald-400 uppercase">
              <ShieldCheck className="w-4 h-4" />
              <span>Institutional Privacy & Security</span>
            </div>
            <h3 className="text-2xl font-bold text-white">Data Privacy & Academic Ethics First</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              EduSense strictly operates on minimal academic indicators (attendance, coursework, marks). No biometric or sensitive demographic variables are processed. Role-based backend middleware enforces student data isolation.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <Link href="/login">
              <MagneticButton variant="primary">
                <span>Access EduSense Portal</span>
              </MagneticButton>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
