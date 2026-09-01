'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import api from '@/lib/api';
import RiskBadge from '@/components/RiskBadge';
import StatCard from '@/components/StatCard';
import {
  Users,
  AlertTriangle,
  CheckCircle2,
  TrendingDown,
  TrendingUp,
  Search,
  Filter,
  ArrowRight,
  BookOpen,
  Calendar,
  Layers,
  Sparkles,
  UserCheck,
  ChevronRight
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
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [riskFilter, setRiskFilter] = useState('ALL');
  const [sortBy, setSortBy] = useState('currentRiskScore');
  const [sortOrder, setSortOrder] = useState('desc');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalStudents, setTotalStudents] = useState(0);

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

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const res = await api.get('/faculty/students', {
        params: {
          search,
          risk: riskFilter,
          sortBy,
          sortOrder,
          page,
          limit: 10
        }
      });
      if (res.data.success) {
        setStudents(res.data.students);
        setTotalPages(res.data.totalPages);
        setTotalStudents(res.data.total);
      }
    } catch (err) {
      console.error('Error loading students list:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  useEffect(() => {
    fetchStudents();
  }, [search, riskFilter, sortBy, sortOrder, page]);

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
          <button
            onClick={() => { setRiskFilter('High'); setPage(1); }}
            className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-medium text-xs whitespace-nowrap transition-colors"
          >
            Review At-Risk Cohort
          </button>
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
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }} />
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
              <BarChart data={subjectAverages} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="subject" stroke="#64748b" fontSize={10} tickFormatter={(val) => val.split(' ')[0]} />
                <YAxis stroke="#64748b" fontSize={11} domain={[0, 100]} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }} />
                <Bar dataKey="averageScore" fill="#6366f1" name="Class Mean %" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      {/* Interactive Students Directory */}
      <div id="students" className="subtle-card rounded-2xl p-6 border border-slate-800 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-bold text-white">Student Roster & Risk Explorer</h3>
            <p className="text-xs text-slate-400">Showing {totalStudents} student records</p>
          </div>

          {/* Filters & Search */}
          <div className="flex flex-wrap items-center gap-3 text-xs">
            {/* Search Input */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
              <input
                type="text"
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                placeholder="Search by name, roll no..."
                className="pl-9 pr-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 w-56"
              />
            </div>

            {/* Risk Filter */}
            <select
              value={riskFilter}
              onChange={(e) => { setRiskFilter(e.target.value); setPage(1); }}
              className="px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-indigo-500"
            >
              <option value="ALL">All Risk Levels</option>
              <option value="High">High Risk</option>
              <option value="Moderate">Moderate Risk</option>
              <option value="Low">Low Risk</option>
            </select>

            {/* Sort Dropdown */}
            <select
              value={`${sortBy}-${sortOrder}`}
              onChange={(e) => {
                const [sb, so] = e.target.value.split('-');
                setSortBy(sb);
                setSortOrder(so);
                setPage(1);
              }}
              className="px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-indigo-500"
            >
              <option value="currentRiskScore-desc">Highest Risk First</option>
              <option value="currentRiskScore-asc">Lowest Risk First</option>
              <option value="attendancePct-asc">Lowest Attendance First</option>
              <option value="internalTestAvg-asc">Lowest Marks First</option>
              <option value="name-asc">Name (A-Z)</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="text-[11px] uppercase tracking-wider text-slate-400 bg-slate-900/60 border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Student</th>
                <th className="py-3 px-4">Attendance</th>
                <th className="py-3 px-4">Assessment Avg</th>
                <th className="py-3 px-4">Assignments</th>
                <th className="py-3 px-4">Trend</th>
                <th className="py-3 px-4">Risk Level</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-500">Loading student records...</td>
                </tr>
              ) : students.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-500">No students found matching current filters.</td>
                </tr>
              ) : (
                students.map((stu: any) => {
                  const risk = stu.currentRiskLevel || 'Moderate';
                  const trend = stu.performanceTrend || 0;

                  return (
                    <tr key={stu._id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-medium text-white">{stu.name}</div>
                        <div className="text-[11px] font-mono text-slate-500">{stu.studentId} • Sem {stu.semester}</div>
                      </td>
                      <td className="py-3 px-4 font-mono font-semibold">
                        <span className={stu.attendancePct < 65 ? 'text-rose-400' : stu.attendancePct < 75 ? 'text-amber-400' : 'text-slate-200'}>
                          {stu.attendancePct}%
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono font-semibold">
                        <span className={stu.internalTestAvg < 45 ? 'text-rose-400' : stu.internalTestAvg < 60 ? 'text-amber-400' : 'text-slate-200'}>
                          {stu.internalTestAvg}%
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono">{stu.assignmentCompletionRate}%</td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center gap-1 font-mono ${
                          trend > 0 ? 'text-emerald-400' : trend < 0 ? 'text-rose-400' : 'text-slate-400'
                        }`}>
                          {trend > 0 ? `+${trend}%` : `${trend}%`}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <RiskBadge level={risk} score={stu.currentRiskScore} showScore size="sm" />
                      </td>
                      <td className="py-3 px-4 text-right">
                        <Link
                          href={`/faculty/students/${stu.studentId}`}
                          className="px-3 py-1.5 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/40 text-indigo-300 border border-indigo-500/30 text-xs font-medium inline-flex items-center gap-1 transition-colors"
                        >
                          <span>Analyze</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </Link>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between text-xs text-slate-400 pt-4 border-t border-slate-800">
            <span>Page {page} of {totalPages}</span>
            <div className="flex items-center gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage(page - 1)}
                className="px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage(page + 1)}
                className="px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

    </div>
  );
}
