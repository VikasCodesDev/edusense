'use client';

import React, { useState, useEffect } from 'react';
import api from '@/lib/api';
import RiskBadge from '@/components/RiskBadge';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { History, TrendingUp, TrendingDown, Clock, CheckCircle2 } from 'lucide-react';

export default function ProgressPage() {
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

  const history = data?.progressHistory || [];
  const chartData = history.map((h: any) => ({
    date: h.date || h.evaluationCycle,
    cycle: h.evaluationCycle || h.date,
    marks: h.internalMarks,
    attendance: h.attendance,
    riskScore: h.riskScore
  }));

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fade-in">
      
      {/* Header */}
      <div>
        <span className="text-xs font-mono uppercase tracking-widest text-indigo-400">Historical Tracking</span>
        <h1 className="text-2xl sm:text-3xl font-bold text-white mt-1">Academic Progress & Risk Trajectory</h1>
        <p className="text-xs sm:text-sm text-slate-400">
          Trace your performance, attendance, and risk index evolution across semester evaluation checkpoints.
        </p>
      </div>

      {/* Progress Chart */}
      <div className="subtle-card rounded-2xl p-6 border border-slate-800 space-y-4">
        <h3 className="text-base font-bold text-white">Multi-Cycle Trend Evolution</h3>
        <div className="h-72 w-full pt-4">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="cycle" stroke="#64748b" fontSize={11} />
              <YAxis stroke="#64748b" fontSize={11} domain={[0, 100]} />
              <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }} />
              <Legend wrapperStyle={{ fontSize: '12px' }} />
              <Line type="monotone" dataKey="marks" stroke="#6366f1" strokeWidth={2} name="Internal Marks %" />
              <Line type="monotone" dataKey="attendance" stroke="#10b981" strokeWidth={2} name="Attendance %" />
              <Line type="monotone" dataKey="riskScore" stroke="#ef4444" strokeWidth={2} strokeDasharray="4 4" name="Risk Score (Index)" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Timeline of Evaluation Checkpoints */}
      <div className="subtle-card rounded-2xl p-6 border border-slate-800 space-y-6">
        <h3 className="text-base font-bold text-white flex items-center gap-2">
          <History className="w-4 h-4 text-indigo-400" />
          <span>Evaluation Checkpoints History</span>
        </h3>

        <div className="relative pl-6 space-y-8 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-800">
          {history.map((h: any, idx: number) => (
            <div key={idx} className="relative space-y-2">
              <div className="absolute -left-[27px] top-1 w-3.5 h-3.5 rounded-full bg-indigo-500 border-2 border-[#090d16]" />
              
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-white">{h.evaluationCycle}</span>
                  <RiskBadge level={h.riskLevel} score={h.riskScore} size="sm" />
                </div>
                <span className="text-xs text-slate-500 font-mono flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  <span>{h.date}</span>
                </span>
              </div>

              <div className="grid grid-cols-3 gap-3 text-xs bg-slate-900/60 p-3 rounded-xl border border-slate-800 max-w-lg">
                <div>
                  <span className="text-slate-400">Attendance:</span>
                  <p className="font-mono font-bold text-white">{h.attendance}%</p>
                </div>
                <div>
                  <span className="text-slate-400">Internal Marks:</span>
                  <p className="font-mono font-bold text-white">{h.internalMarks}%</p>
                </div>
                <div>
                  <span className="text-slate-400">Risk Score:</span>
                  <p className="font-mono font-bold text-white">{h.riskScore}/100</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
