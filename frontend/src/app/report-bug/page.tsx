'use client';

import { useState } from 'react';
import type { FormEvent } from 'react';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';

export default function ReportBugPage() {
  const { user } = useAuth();
  const [form, setForm] = useState({ title: '', description: '', severity: 'Medium', page: '', additionalDetails: '' });
  const [status, setStatus] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const submit = async (event: FormEvent) => {
    event.preventDefault();
    try {
      const response = await api.post('/bug-reports', form);
      setStatus({ type: 'success', text: response.data.message });
      setForm({ title: '', description: '', severity: 'Medium', page: '', additionalDetails: '' });
    } catch (error: any) {
      setStatus({ type: 'error', text: error.response?.data?.errors?.join(' ') || error.response?.data?.error || 'Unable to submit bug report.' });
    }
  };
  return <div className="max-w-2xl mx-auto px-4 py-12 space-y-6"><div><h1 className="text-3xl font-bold text-white">Report a Bug</h1><p className="text-slate-400 mt-2">Help us improve EduSense by sharing a clear description of the issue.</p></div>{status && <div className={`rounded-lg border p-3 text-sm ${status.type === 'success' ? 'border-emerald-500/30 text-emerald-400 bg-emerald-500/10' : 'border-rose-500/30 text-rose-400 bg-rose-500/10'}`}>{status.text}</div>}{!user && <p className="text-sm text-amber-400">Please sign in as a student or faculty member to submit a report.</p>}<form onSubmit={submit} className="subtle-card rounded-2xl border border-slate-800 p-6 space-y-4"><input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="w-full rounded-lg bg-slate-900 border border-slate-700 p-3 text-white" placeholder="Bug title" /><textarea required value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={5} className="w-full rounded-lg bg-slate-900 border border-slate-700 p-3 text-white" placeholder="Describe what happened and how to reproduce it." /><div className="grid grid-cols-1 sm:grid-cols-2 gap-4"><select value={form.severity} onChange={(e) => setForm({ ...form, severity: e.target.value })} className="rounded-lg bg-slate-900 border border-slate-700 p-3 text-white"><option>Low</option><option>Medium</option><option>High</option><option>Critical</option></select><input required value={form.page} onChange={(e) => setForm({ ...form, page: e.target.value })} className="rounded-lg bg-slate-900 border border-slate-700 p-3 text-white" placeholder="Current page/module" /></div><textarea value={form.additionalDetails} onChange={(e) => setForm({ ...form, additionalDetails: e.target.value })} rows={3} className="w-full rounded-lg bg-slate-900 border border-slate-700 p-3 text-white" placeholder="Additional details (optional)" /><button disabled={!user} type="submit" className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white disabled:opacity-50">Submit Bug Report</button></form></div>;
}
