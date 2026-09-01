'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import api from '@/lib/api';
import RiskBadge from '@/components/RiskBadge';
import {
  AlertTriangle,
  Cpu,
  RefreshCw,
  ShieldAlert,
  CheckCircle2,
  HelpCircle,
  TrendingDown,
  Info
} from 'lucide-react';

export default function RiskAnalysisPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchAnalysis = async () => {
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
    fetchAnalysis();
  }, []);

  const handleRecalculateRisk = async () => {
    try {
      setRefreshing(true);
      const res = await api.get('/students/me/risk');
      if (res.data.success) {
        await fetchAnalysis();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setRefreshing(false);
    }
  };

  if (loading) {
    return <div className="max-w-7xl mx-auto px-4 py-12 animate-pulse space-y-6"><div className="h-60 bg-slate-800/50 rounded-2xl" /></div>;
  }

  const student = data?.student;
  const hasAcademicData = Boolean(student?.academicDataComplete || (student?.attendancePct !== undefined && student?.internalTestAvg !== undefined && student?.subjects?.length));
  if (!hasAcademicData) {
    return (
      <div className="max-w-xl mx-auto my-16 px-4 text-center space-y-4">
        <h2 className="text-xl font-bold text-white">Risk Analysis Not Available Yet</h2>
        <p className="text-sm text-slate-400">Enter your academic data before running the ML risk analysis.</p>
        <Link href="/student/profile" className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium inline-flex">Update Academic Data</Link>
      </div>
    );
  }
  const prediction = data?.prediction;
  const riskLevel = prediction?.risk_level || student?.currentRiskLevel || 'Moderate';
  const riskScore = prediction?.risk_score !== undefined ? prediction.risk_score : (student?.currentRiskScore ?? 0);
  const factors = prediction?.contributing_factors || [];
  const probs = prediction?.probabilities || { low: 0, moderate: 0, high: 0 };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fade-in">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-mono uppercase tracking-widest text-indigo-400">Explainable Machine Learning</span>
          <h1 className="text-2xl sm:text-3xl font-bold text-white mt-1">Academic Risk Analysis</h1>
          <p className="text-xs sm:text-sm text-slate-400">
            Multi-model diagnostic prediction explaining factors associated with academic standing.
          </p>
        </div>

        <button
          onClick={handleRecalculateRisk}
          disabled={refreshing}
          className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium inline-flex items-center gap-2 shadow-sm transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
          <span>{refreshing ? 'Evaluating ML...' : 'Recalculate Risk Index'}</span>
        </button>
      </div>

      {/* Responsible Academic Disclaimer Banner */}
      <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-700/80 text-xs text-slate-300 flex items-start gap-3">
        <Info className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
        <div>
          <span className="font-semibold text-white">Responsible Academic Framework:</span>{' '}
          EduSense flags <em>Potential Academic Risk</em> to assist faculty and students in taking proactive measures. These predictions represent statistical associations from historical student outcomes and do not determine future certainty.
        </div>
      </div>

      {/* Main Risk Status & Probabilities Card */}
      <div className="subtle-card rounded-2xl p-6 sm:p-8 border border-slate-800 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-slate-800 pb-6">
          <div className="space-y-1">
            <span className="text-xs font-mono uppercase tracking-wider text-slate-400">Current Evaluation</span>
            <div className="flex items-center gap-3">
              <RiskBadge level={riskLevel} score={riskScore} size="lg" />
              <span className="text-xs text-slate-400 font-mono">
                Risk Score: <strong className="text-white text-sm">{riskScore}/100</strong>
              </span>
            </div>
          </div>

          <div className="flex items-center gap-6 text-xs text-slate-400 font-mono">
            <div>
              <p className="text-slate-500 text-[10px]">Algorithm</p>
              <p className="text-slate-200 font-semibold">{prediction?.model_algorithm || 'Random Forest'}</p>
            </div>
            <div>
              <p className="text-slate-500 text-[10px]">Model Version</p>
              <p className="text-slate-200 font-semibold">{prediction?.model_version || '1.0.4'}</p>
            </div>
            <div>
              <p className="text-slate-500 text-[10px]">Confidence</p>
              <p className="text-indigo-400 font-semibold">{prediction?.confidence_percentage || 94}%</p>
            </div>
          </div>
        </div>

        {/* Probability Stacked Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs text-slate-300">
            <span>Class Probability Distribution</span>
            <span className="font-mono text-slate-400">
              Low: {(probs.low * 100).toFixed(1)}% | Mod: {(probs.moderate * 100).toFixed(1)}% | High: {(probs.high * 100).toFixed(1)}%
            </span>
          </div>
          <div className="w-full h-3 bg-slate-800 rounded-full flex overflow-hidden">
            <div style={{ width: `${probs.low * 100}%` }} className="bg-emerald-500 h-full" title="Low Risk" />
            <div style={{ width: `${probs.moderate * 100}%` }} className="bg-amber-500 h-full" title="Moderate Risk" />
            <div style={{ width: `${probs.high * 100}%` }} className="bg-rose-500 h-full" title="High Risk" />
          </div>
        </div>
      </div>

      {/* Explainability: Contributing Factors */}
      <div className="subtle-card rounded-2xl p-6 border border-slate-800 space-y-5">
        <div>
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Cpu className="w-4 h-4 text-indigo-400" />
            <span>Key Contributing Indicators</span>
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Individual student metrics that heavily influenced the model&apos;s risk classification.
          </p>
        </div>

        <div className="space-y-3">
          {factors.map((f: any, idx: number) => {
            const isNegative = (f.impact || '').toLowerCase().includes('negative');
            return (
              <div
                key={idx}
                className={`p-4 rounded-xl border text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                  isNegative
                    ? 'bg-rose-500/5 border-rose-500/20 text-slate-200'
                    : 'bg-emerald-500/5 border-emerald-500/20 text-slate-200'
                }`}
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2 font-semibold text-white">
                    {isNegative ? <AlertTriangle className="w-4 h-4 text-rose-400" /> : <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                    <span>{f.factor}</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded font-mono ${
                      isNegative ? 'bg-rose-500/20 text-rose-300' : 'bg-emerald-500/20 text-emerald-300'
                    }`}>
                      {f.impact}
                    </span>
                  </div>
                  <p className="text-slate-400">{f.description}</p>
                </div>

                <div className="sm:text-right shrink-0 font-mono text-[11px] text-slate-300 space-y-0.5 bg-slate-900/60 p-2.5 rounded-lg border border-slate-800">
                  <div>Value: <strong className="text-white">{f.value}</strong></div>
                  <div className="text-slate-500 text-[10px]">{f.benchmark}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
}
