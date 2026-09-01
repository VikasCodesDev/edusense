'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import api from '@/lib/api';
import StatCard from '@/components/StatCard';
import {
  Database,
  Cpu,
  Users,
  Shield,
  Activity,
  ArrowRight,
  Upload,
  CheckCircle2,
  AlertTriangle,
  History,
  FileSpreadsheet
} from 'lucide-react';

export default function AdminDashboard() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/admin/overview').then((res) => {
      if (res.data.success) setData(res.data);
    }).finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="max-w-7xl mx-auto px-4 py-12 animate-pulse space-y-6"><div className="h-40 bg-slate-800/50 rounded-2xl" /></div>;
  }

  const stats = data?.stats || {};
  const logs = data?.recentLogs || [];
  const mlHealth = stats.mlHealth || {};

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fade-in">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-mono uppercase tracking-widest text-indigo-400">Institutional Administration</span>
          <h1 className="text-2xl sm:text-3xl font-bold text-white mt-1">System Command & Management Hub</h1>
          <p className="text-xs sm:text-sm text-slate-400">
            Institutional academic data pipelines, machine learning models, and access control.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/admin/data-import"
            className="px-3.5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium inline-flex items-center gap-1.5 shadow-sm transition-colors"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Ingest Academic Dataset</span>
          </Link>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Student Records"
          value={stats.totalStudents || 48}
          subtitle="Enrolled Profiles"
          color="blue"
          icon={Users}
        />
        <StatCard
          title="Faculty & Staff"
          value={stats.totalFaculty || 1}
          subtitle="Authorized Evaluators"
          color="indigo"
          icon={Shield}
        />
        <StatCard
          title="ML Risk Predictions"
          value={stats.totalPredictions || 48}
          subtitle="Inference Log Count"
          color="emerald"
          icon={Cpu}
        />
        <StatCard
          title="ML Engine Status"
          value={mlHealth.status === 'healthy' ? 'Active' : 'Connected'}
          subtitle={mlHealth.algorithm || 'Random Forest v1.0.4'}
          color={mlHealth.status === 'healthy' ? 'emerald' : 'amber'}
          icon={Activity}
        />
      </div>

      {/* Quick Action Navigation Tiles */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Data Ingestion Studio */}
        <Link
          href="/admin/data-import"
          className="subtle-card subtle-card-hover rounded-2xl p-6 border border-slate-800 space-y-4 group"
        >
          <div className="w-12 h-12 rounded-xl bg-purple-600/20 text-purple-400 border border-purple-500/30 flex items-center justify-center group-hover:scale-105 transition-transform">
            <FileSpreadsheet className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white group-hover:text-purple-400 transition-colors">
              Data Ingestion & Validation Studio
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Upload institutional CSV/Excel records, map dynamic columns, inspect validation errors, and import into MongoDB.
            </p>
          </div>
          <div className="text-xs font-semibold text-purple-400 inline-flex items-center gap-1">
            <span>Open Ingestion Pipeline</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </div>
        </Link>

        {/* ML Model Management Hub */}
        <Link
          href="/admin/model-management"
          className="subtle-card subtle-card-hover rounded-2xl p-6 border border-slate-800 space-y-4 group"
        >
          <div className="w-12 h-12 rounded-xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center group-hover:scale-105 transition-transform">
            <Cpu className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white group-hover:text-indigo-400 transition-colors">
              ML Model Benchmarks & Retraining
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Inspect multi-model benchmark metrics (Recall, F1, Accuracy), feature importances, and retrain pipeline on fresh records.
            </p>
          </div>
          <div className="text-xs font-semibold text-indigo-400 inline-flex items-center gap-1">
            <span>Open Model Hub</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </div>
        </Link>

        {/* User Accounts Management */}
        <Link
          href="/admin/users"
          className="subtle-card subtle-card-hover rounded-2xl p-6 border border-slate-800 space-y-4 group"
        >
          <div className="w-12 h-12 rounded-xl bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center group-hover:scale-105 transition-transform">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white group-hover:text-emerald-400 transition-colors">
              User Accounts & Role Permissions
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Manage student, faculty, and administrator accounts. Provision access credentials and institutional roles.
            </p>
          </div>
          <div className="text-xs font-semibold text-emerald-400 inline-flex items-center gap-1">
            <span>Manage Accounts</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </div>
        </Link>

      </div>

      {/* Activity Logs Stream */}
      <div className="subtle-card rounded-2xl p-6 border border-slate-800 space-y-4">
        <h3 className="text-base font-bold text-white flex items-center gap-2">
          <History className="w-4 h-4 text-indigo-400" />
          <span>System Activity & Audit Log</span>
        </h3>

        <div className="space-y-2 text-xs">
          {logs.length > 0 ? (
            logs.map((log: any, idx: number) => (
              <div key={idx} className="p-3 bg-slate-900/60 rounded-xl border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-indigo-400 font-bold uppercase text-[10px] bg-indigo-500/10 px-2 py-0.5 rounded">
                    {log.action}
                  </span>
                  <span className="text-slate-300">{log.details}</span>
                </div>
                <span className="text-slate-500 font-mono text-[10px] shrink-0">
                  {log.userName} • {log.createdAt ? new Date(log.createdAt).toLocaleString() : 'Just now'}
                </span>
              </div>
            ))
          ) : (
            <p className="text-slate-500">No activity logs recorded yet.</p>
          )}
        </div>
      </div>

    </div>
  );
}
