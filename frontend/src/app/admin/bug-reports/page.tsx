'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';

const statuses = ['Open', 'In Progress', 'Resolved', 'Closed'];

export default function BugReportsPage() {
  const [reports, setReports] = useState<any[]>([]);
  const [selected, setSelected] = useState<any>(null);
  const [error, setError] = useState('');
  const loadReports = async () => {
    try {
      const response = await api.get('/admin/bug-reports');
      setReports(response.data.reports || []);
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'Unable to load bug reports.');
    }
  };
  useEffect(() => { loadReports(); }, []);
  const updateStatus = async (id: string, status: string) => {
    try {
      const response = await api.put(`/admin/bug-reports/${id}/status`, { status });
      setReports((current) => current.map((report) => report._id === id ? response.data.report : report));
      setSelected((current: any) => current?._id === id ? response.data.report : current);
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'Unable to update bug report.');
    }
  };
  return <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6"><div><span className="text-xs font-mono uppercase tracking-widest text-indigo-400">Support Operations</span><h1 className="text-3xl font-bold text-white mt-1">Reported Bugs</h1><p className="text-sm text-slate-400 mt-1">Review submitted reports and track their resolution status.</p></div>{error && <p className="text-sm text-rose-400">{error}</p>}<div className="subtle-card rounded-2xl border border-slate-800 overflow-x-auto"><table className="w-full text-left text-xs text-slate-300"><thead className="bg-slate-900/60 text-slate-400 uppercase"><tr>{['Title', 'Reporter', 'Role', 'Severity', 'Page', 'Submitted', 'Status'].map((label) => <th key={label} className="px-4 py-3">{label}</th>)}</tr></thead><tbody className="divide-y divide-slate-800">{reports.map((report) => <tr key={report._id} onClick={() => setSelected(report)} className="cursor-pointer hover:bg-slate-800/40"><td className="px-4 py-3 font-medium text-white">{report.title}</td><td className="px-4 py-3">{report.reporter}</td><td className="px-4 py-3 capitalize">{report.role}</td><td className="px-4 py-3">{report.severity}</td><td className="px-4 py-3">{report.page}</td><td className="px-4 py-3">{new Date(report.createdAt).toLocaleString()}</td><td className="px-4 py-3"><select value={report.status} onClick={(e) => e.stopPropagation()} onChange={(e) => updateStatus(report._id, e.target.value)} className="rounded bg-slate-900 border border-slate-700 px-2 py-1 text-white">{statuses.map((status) => <option key={status}>{status}</option>)}</select></td></tr>)}</tbody></table>{reports.length === 0 && <p className="p-6 text-sm text-slate-500">No bug reports have been submitted.</p>}</div>{selected && <div className="subtle-card rounded-2xl border border-slate-800 p-6 space-y-3"><div className="flex items-center justify-between"><h2 className="text-lg font-bold text-white">{selected.title}</h2><button onClick={() => setSelected(null)} className="text-xs text-slate-400 hover:text-white">Close</button></div><p className="text-sm text-slate-300 whitespace-pre-wrap">{selected.description}</p>{selected.additionalDetails && <p className="text-sm text-slate-400 whitespace-pre-wrap">{selected.additionalDetails}</p>}<p className="text-xs text-slate-500">Reporter: {selected.reporter} ({selected.reporterEmail})</p></div>}</div>;
}
