'use client';

import React, { useState, useEffect } from 'react';
import api from '@/lib/api';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ScatterChart,
  Scatter,
  ZAxis
} from 'recharts';
import { BarChart3, TrendingUp, Users, AlertTriangle } from 'lucide-react';

export default function FacultyAnalyticsPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/faculty/dashboard').then((res) => {
      if (res.data.success) setData(res.data);
    }).finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="max-w-7xl mx-auto px-4 py-12 animate-pulse"><div className="h-40 bg-slate-800/50 rounded-2xl" /></div>;
  }

  const subjectAverages = data?.subjectAverages || [];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fade-in">
      <div>
        <span className="text-xs font-mono uppercase tracking-widest text-indigo-400">Institutional Analytics</span>
        <h1 className="text-2xl sm:text-3xl font-bold text-white mt-1">Cohort Academic Analytics</h1>
        <p className="text-xs sm:text-sm text-slate-400">
          Cross-subject performance diagnostics, attendance correlation, and risk stratification.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Subject Performance Benchmark */}
        <div className="subtle-card rounded-2xl p-6 border border-slate-800 space-y-4">
          <h3 className="text-base font-bold text-white">Curriculum Performance Index</h3>
          <div className="h-72 w-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={subjectAverages} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="subject" stroke="#64748b" fontSize={10} tickFormatter={(val) => val.split(' ')[0]} />
                <YAxis stroke="#64748b" fontSize={11} domain={[0, 100]} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }} />
                <Bar dataKey="averageScore" fill="#6366f1" name="Subject Mean %" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Risk Breakdown Table */}
        <div className="subtle-card rounded-2xl p-6 border border-slate-800 space-y-4">
          <h3 className="text-base font-bold text-white">Cohort Risk Profile</h3>
          <p className="text-xs text-slate-400">Class risk segment summary</p>

          <div className="space-y-4 pt-2">
            <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-between text-xs">
              <div>
                <p className="font-bold text-rose-300">High Risk Cohort ({data?.stats?.highRiskCount} Students)</p>
                <p className="text-slate-400 text-[11px] mt-0.5">Below 60% attendance or severe assessment drop</p>
              </div>
              <span className="text-sm font-mono font-bold text-rose-400">{data?.stats?.highRiskCount}</span>
            </div>

            <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-between text-xs">
              <div>
                <p className="font-bold text-amber-300">Moderate Risk Cohort ({data?.stats?.moderateRiskCount} Students)</p>
                <p className="text-slate-400 text-[11px] mt-0.5">Borderline attendance (60-74%) or fluctuating marks</p>
              </div>
              <span className="text-sm font-mono font-bold text-amber-400">{data?.stats?.moderateRiskCount}</span>
            </div>

            <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-between text-xs">
              <div>
                <p className="font-bold text-emerald-300">Low Risk Cohort ({data?.stats?.lowRiskCount} Students)</p>
                <p className="text-slate-400 text-[11px] mt-0.5">Consistent attendance &gt;= 75% and stable marks</p>
              </div>
              <span className="text-sm font-mono font-bold text-emerald-400">{data?.stats?.lowRiskCount}</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
