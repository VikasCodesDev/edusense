'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { ChevronRight, Search } from 'lucide-react';
import api from '@/lib/api';
import RiskBadge from '@/components/RiskBadge';

export default function FacultyStudentsPage() {
  const [students, setStudents] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [riskFilter, setRiskFilter] = useState(() => {
    if (typeof window !== 'undefined') {
      const risk = new URLSearchParams(window.location.search).get('risk');
      if (risk === 'High' || risk === 'Moderate' || risk === 'Low') return risk;
    }
    return 'ALL';
  });
  const [sortBy, setSortBy] = useState('currentRiskScore');
  const [sortOrder, setSortOrder] = useState('desc');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalStudents, setTotalStudents] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStudents = async () => {
      try {
        setLoading(true);
        const res = await api.get('/faculty/students', {
          params: { search, risk: riskFilter, sortBy, sortOrder, page, limit: 10 }
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

    fetchStudents();
  }, [search, riskFilter, sortBy, sortOrder, page]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fade-in">
      <div>
        <span className="text-xs font-mono uppercase tracking-widest text-indigo-400">Faculty Console</span>
        <h1 className="text-2xl sm:text-3xl font-bold text-white mt-1">Student Directory</h1>
        <p className="text-xs sm:text-sm text-slate-400">Search, filter, and review student performance and risk.</p>
      </div>

      <div className="subtle-card rounded-2xl p-6 border border-slate-800 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-bold text-white">Student Roster & Risk Explorer</h3>
            <p className="text-xs text-slate-400">Showing {totalStudents} student records</p>
          </div>
          <div className="flex flex-wrap items-center gap-3 text-xs">
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
                <tr><td colSpan={7} className="py-8 text-center text-slate-500">Loading student records...</td></tr>
              ) : students.length === 0 ? (
                <tr><td colSpan={7} className="py-8 text-center text-slate-500">No students found matching current filters.</td></tr>
              ) : students.map((stu: any) => {
                const risk = stu.currentRiskLevel || 'Moderate';
                const trend = stu.performanceTrend || 0;
                return (
                  <tr key={stu._id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-medium text-white">{stu.name}</div>
                      <div className="text-[11px] font-mono text-slate-500">{stu.studentId} • Sem {stu.semester}</div>
                    </td>
                    <td className="py-3 px-4 font-mono font-semibold"><span className={stu.attendancePct < 65 ? 'text-rose-400' : stu.attendancePct < 75 ? 'text-amber-400' : 'text-slate-200'}>{stu.attendancePct}%</span></td>
                    <td className="py-3 px-4 font-mono font-semibold"><span className={stu.internalTestAvg < 45 ? 'text-rose-400' : stu.internalTestAvg < 60 ? 'text-amber-400' : 'text-slate-200'}>{stu.internalTestAvg}%</span></td>
                    <td className="py-3 px-4 font-mono">{stu.assignmentCompletionRate}%</td>
                    <td className="py-3 px-4"><span className={`inline-flex items-center gap-1 font-mono ${trend > 0 ? 'text-emerald-400' : trend < 0 ? 'text-rose-400' : 'text-slate-400'}`}>{trend > 0 ? `+${trend}%` : `${trend}%`}</span></td>
                    <td className="py-3 px-4"><RiskBadge level={risk} score={stu.currentRiskScore} showScore size="sm" /></td>
                    <td className="py-3 px-4 text-right">
                      <Link href={`/faculty/students/${stu.studentId}`} className="px-3 py-1.5 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/40 text-indigo-300 border border-indigo-500/30 text-xs font-medium inline-flex items-center gap-1 transition-colors">
                        <span>Analyze</span><ChevronRight className="w-3.5 h-3.5" />
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between text-xs text-slate-400 pt-4 border-t border-slate-800">
            <span>Page {page} of {totalPages}</span>
            <div className="flex items-center gap-2">
              <button disabled={page <= 1} onClick={() => setPage(page - 1)} className="px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed">Previous</button>
              <button disabled={page >= totalPages} onClick={() => setPage(page + 1)} className="px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed">Next</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
