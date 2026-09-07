'use client';

import { useState } from 'react';
import type { FormEvent } from 'react';

export default function ReportBugPage() {
  const [message, setMessage] = useState('');
  const submit = (event: FormEvent) => {
    event.preventDefault();
    window.location.href = `mailto:edusense.admin@gmail.com?subject=EduSense%20bug%20report&body=${encodeURIComponent(message)}`;
  };
  return <div className="max-w-xl mx-auto px-4 py-12 space-y-5"><h1 className="text-3xl font-bold text-white">Report a Bug</h1><p className="text-slate-400">Describe the issue and your mail application will prepare a report for the EduSense administrator.</p><form onSubmit={submit} className="space-y-4"><textarea required value={message} onChange={(e) => setMessage(e.target.value)} rows={6} className="w-full rounded-lg bg-slate-900 border border-slate-700 p-3 text-white" placeholder="What happened? Include the page and steps to reproduce." /><button type="submit" className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white">Prepare Bug Report</button></form></div>;
}
