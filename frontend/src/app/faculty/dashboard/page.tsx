'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import api from '@/lib/api';
import StatCard from '@/components/StatCard';
import {
  Users,
  AlertTriangle,
  ArrowRight,
  BookOpen,
  Calendar,
  Layers,
  CheckCircle2
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';

export default function FacultyDashboard() {
  const [dashboardData, setDashboardData] = useState<any>(null);

  const fetchDashboard = async () => {
    try {
      const res = await api.get('/faculty/dashboard');
      if (res.data.success) {
        setDashboardData(res.data);
      }
    } catch (err) {
      console.error('Error loading faculty dashboard:', err);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  const stats = dashboardData?.stats || {
    totalStudents: 48,
    highRiskCount: 12,
    moderateRiskCount: 15,
    lowRiskCount: 21,
    avgAttendance: 74.2,
    avgMarks: 62.8
  };

  const riskDist = dashboardData?.riskDistribution || [
    { name: 'Low Risk', count: 21, color: '#10b981' },
    { name: 'Moderate Risk', count: 15, color: '#f59e0b' },
    { name: 'High Risk', count: 12, color: '#ef4444' }
  ];

  const subjectAverages = dashboardData?.subjectAverages || [];
  const earlyWarnings = dashboardData?.earlyWarningAlerts || [];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fade-in">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-mono uppercase tracking-widest text-indigo-400">Department Faculty Console</span>
          <h1 className="text-2xl sm:text-3xl font-bold text-white mt-1">Class Overview & Risk Monitor</h1>
          <p className="text-xs sm:text-sm text-slate-400">
            Real-time cohort risk stratification, early decline alerts, and proactive intervention logging.
          </p>
        </div>

        <Link
          href="/faculty/analytics"
          className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-medium inline-flex items-center gap-1.5 transition-colors"
        >
          <span>Cohort Analytics & Trends</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* Early Warning Banner if students flagged */}
      {earlyWarnings.length > 0 && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-300 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-rose-500/20 text-rose-400 shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <span className="font-bold text-white text-sm">Early Warning Detection: </span>
              <span>{earlyWarnings.length} student(s) exhibit continuous performance decline or critical attendance deficits.</span>
            </div>
          </div>
          <Link
            href="/faculty/students?risk=High"
            className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-medium text-xs whitespace-nowrap transition-colors"
          >
            Review At-Risk Cohort
          </Link>
        </div>
      )}

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard
          title="Total Enrolled"
          value={stats.totalStudents}
          subtitle="Active Students"
          color="blue"
          icon={Users}
        />
        <StatCard
          title="High Risk"
          value={stats.highRiskCount}
          subtitle="Immediate Intervention"
          color="rose"
          icon={AlertTriangle}
        />
        <StatCard
          title="Moderate Risk"
          value={stats.moderateRiskCount}
          subtitle="Monitor Closely"
          color="amber"
          icon={Layers}
        />
        <StatCard
          title="Class Attendance"
          value={`${stats.avgAttendance}%`}
          subtitle="Institutional Avg"
          progress={stats.avgAttendance}
          color="emerald"
          icon={Calendar}
        />
        <StatCard
          title="Internal Test Avg"
          value={`${stats.avgMarks}%`}
          subtitle="Continuous Assessments"
          progress={stats.avgMarks}
          color="indigo"
          icon={BookOpen}
        />
      </div>

      {/* Charts Grid: Risk Distribution & Subject Averages */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Risk Distribution Pie */}
        <div className="subtle-card rounded-2xl p-6 border border-slate-800 space-y-4">
          <div>
            <h3 className="text-base font-bold text-white">Cohort Risk Distribution</h3>
            <p className="text-xs text-slate-400">Class composition by predicted risk level</p>
          </div>

          <div className="h-56 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={riskDist}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="count"
                >
                  {riskDist.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Legend formatter={(value) => <span className="text-slate-300 text-xs">{value}</span>} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    borderColor: '#e2e8f0',
                    borderRadius: '8px',
                    fontSize: '12px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
                  }}
                  itemStyle={{ color: '#0f172a', fontWeight: 600 }}
                  labelStyle={{ color: '#64748b', fontWeight: 500 }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-3 gap-2 text-center text-xs pt-2 border-t border-slate-800">
            <div>
              <span className="text-emerald-400 font-bold">{stats.lowRiskCount}</span>
              <p className="text-[10px] text-slate-400">Low Risk</p>
            </div>
            <div>
              <span className="text-amber-400 font-bold">{stats.moderateRiskCount}</span>
              <p className="text-[10px] text-slate-400">Moderate</p>
            </div>
            <div>
              <span className="text-rose-400 font-bold">{stats.highRiskCount}</span>
              <p className="text-[10px] text-slate-400">High Risk</p>
            </div>
          </div>
        </div>

        {/* Subject Performance Averages Bar Chart */}
        <div className="lg:col-span-2 subtle-card rounded-2xl p-6 border border-slate-800 space-y-4">
          <div>
            <h3 className="text-base font-bold text-white">Subject-wise Class Averages</h3>
            <p className="text-xs text-slate-400">Mean internal assessment score across course curricula</p>
          </div>

          <div className="h-64 w-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={subjectAverages} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="subject" stroke="#64748b" fontSize={10} />
                <YAxis stroke="#64748b" fontSize={11} domain={[0, 100]} />
                <Tooltip cursor={{ fill: '#1e293b', opacity: 0.35 }} contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }} />
                <Bar dataKey="averageScore" fill="#6366f1" name="Class Mean %" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

    </div>
  );
}
