'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import { Mail, GraduationCap, Building, Shield, Save, AlertCircle, CheckCircle2, Plus, Trash2 } from 'lucide-react';
import RiskBadge from '@/components/RiskBadge';

export default function ProfilePage() {
  const { user, studentData } = useAuth();
  const [student, setStudent] = useState<any>(studentData);
  const [form, setForm] = useState<any>({
    attendancePct: '',
    internalTestAvg: '',
    assignmentCompletionRate: '',
    previousExamScore: '',
    performanceTrend: '',
    semester: 1,
    subjects: []
  });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.get('/students/me').then((res) => {
      if (res.data.success) {
        const loaded = res.data.student;
        setStudent(loaded);
        setForm({
          attendancePct: loaded.attendancePct ?? '',
          internalTestAvg: loaded.internalTestAvg ?? '',
          assignmentCompletionRate: loaded.assignmentCompletionRate ?? '',
          previousExamScore: loaded.previousExamScore ?? '',
          performanceTrend: loaded.performanceTrend ?? 0,
          semester: loaded.semester ?? 1,
          subjects: loaded.subjects || []
        });
      }
    }).catch((err) => setError(err.response?.data?.error || err.message));
  }, []);

  const updateSubject = (idx: number, field: string, value: string) => {
    setForm((prev: any) => ({
      ...prev,
      subjects: prev.subjects.map((subject: any, index: number) => index === idx ? { ...subject, [field]: value } : subject)
    }));
  };

  const addSubject = () => {
    setForm((prev: any) => ({
      ...prev,
      subjects: [
        ...prev.subjects,
        { id: `subject-${Date.now()}`, name: '', score: '', attendance: '', assignmentCompletion: '', trend: 'stable' }
      ]
    }));
  };

  const removeSubject = (idx: number) => {
    setForm((prev: any) => ({
      ...prev,
      subjects: prev.subjects.filter((_: any, index: number) => index !== idx)
    }));
  };

  const handleSaveAcademicData = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      setError(null);
      setMessage(null);
      const res = await api.put('/students/me/academic-data', form);
      if (res.data.success) {
        setStudent(res.data.student);
        setMessage(res.data.message);
      }
    } catch (err: any) {
      const errors = err.response?.data?.errors;
      setError(errors?.join(' ') || err.response?.data?.error || err.message || 'Unable to save academic data.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fade-in">
      <div>
        <span className="text-xs font-mono uppercase tracking-widest text-indigo-400">Institutional Identity</span>
        <h1 className="text-2xl sm:text-3xl font-bold text-white mt-1">Student Academic Profile</h1>
        <p className="text-xs sm:text-sm text-slate-400">
          Enrolled program details and academic identity attributes.
        </p>
      </div>

      <div className="subtle-card rounded-2xl p-6 sm:p-8 border border-slate-800 space-y-6">
        <div className="flex items-center gap-4 border-b border-slate-800 pb-6">
          <div className="w-16 h-16 rounded-2xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center font-bold text-xl">
            {user?.name ? user.name.charAt(0) : 'S'}
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-bold text-white">{user?.name}</h2>
              {(student?.academicDataComplete || student?.attendancePct !== undefined) && <RiskBadge level={student.currentRiskLevel} score={student.currentRiskScore} size="sm" />}
            </div>
            <p className="text-xs text-slate-400 font-mono mt-0.5">ID: {student?.studentId || user?.studentId || 'Not linked'}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs">
          <div className="space-y-1 bg-slate-900/60 p-4 rounded-xl border border-slate-800">
            <span className="text-slate-400 flex items-center gap-1.5 font-medium">
              <Mail className="w-4 h-4 text-indigo-400" />
              <span>Email Address</span>
            </span>
            <p className="text-sm font-semibold text-white">{user?.email}</p>
          </div>

          <div className="space-y-1 bg-slate-900/60 p-4 rounded-xl border border-slate-800">
            <span className="text-slate-400 flex items-center gap-1.5 font-medium">
              <GraduationCap className="w-4 h-4 text-indigo-400" />
              <span>Enrolled Degree Program</span>
            </span>
            <p className="text-sm font-semibold text-white">{student?.course || 'B.Tech Computer Science'}</p>
          </div>

          <div className="space-y-1 bg-slate-900/60 p-4 rounded-xl border border-slate-800">
            <span className="text-slate-400 flex items-center gap-1.5 font-medium">
              <Building className="w-4 h-4 text-indigo-400" />
              <span>Academic Department</span>
            </span>
            <p className="text-sm font-semibold text-white">{student?.department || 'Computer Science & Engineering'}</p>
          </div>

          <div className="space-y-1 bg-slate-900/60 p-4 rounded-xl border border-slate-800">
            <span className="text-slate-400 flex items-center gap-1.5 font-medium">
              <Shield className="w-4 h-4 text-indigo-400" />
              <span>Current Semester</span>
            </span>
            <p className="text-sm font-semibold text-white">Semester {student?.semester || form.semester || 1}</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSaveAcademicData} className="subtle-card rounded-2xl p-6 sm:p-8 border border-slate-800 space-y-6">
        <div>
          <h2 className="text-lg font-bold text-white">Update Academic Data</h2>
          <p className="text-xs text-slate-400 mt-1">Enter your current academic indicators for ML risk prediction and personalized guidance.</p>
        </div>

        {message && (
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-lg text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            <span>{message}</span>
          </div>
        )}
        {error && (
          <div className="p-3 bg-rose-500/10 border border-rose-500/30 text-rose-400 rounded-lg text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            <span>{error}</span>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div>
            <label className="block text-slate-300 font-medium mb-1.5">Current Semester</label>
            <select
              required
              value={form.semester}
              onChange={(e) => setForm((prev: any) => ({ ...prev, semester: Number(e.target.value) }))}
              className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-indigo-500"
            >
              {[1, 2, 3, 4, 5, 6, 7, 8].map((sem) => (
                <option key={sem} value={sem}>Semester {sem}</option>
              ))}
            </select>
          </div>

          {[
            ['attendancePct', 'Attendance %'],
            ['internalTestAvg', 'Assessment / Internal Marks'],
            ['assignmentCompletionRate', 'Assignment %'],
            ['previousExamScore', 'Previous Exam Score'],
            ['performanceTrend', 'Performance Trend']
          ].map(([field, label]) => (
            <div key={field}>
              <label className="block text-slate-300 font-medium mb-1.5">{label}</label>
              <input
                type="number"
                min={field === 'performanceTrend' ? -100 : 0}
                max={100}
                step="0.1"
                required={field !== 'performanceTrend'}
                value={form[field]}
                onChange={(e) => setForm((prev: any) => ({ ...prev, [field]: e.target.value }))}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>
          ))}
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-sm font-bold text-white">Subject-wise Academic Records</h3>
            <button
              type="button"
              onClick={addSubject}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-medium inline-flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Subject</span>
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="text-[11px] uppercase tracking-wider text-slate-400 bg-slate-900/60 border-b border-slate-800">
                <tr>
                  <th className="py-2.5 px-3">Subject</th>
                  <th className="py-2.5 px-3">Marks</th>
                  <th className="py-2.5 px-3">Attendance</th>
                  <th className="py-2.5 px-3">Assignments</th>
                  <th className="py-2.5 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {form.subjects.map((subject: any, idx: number) => (
                  <tr key={subject.id || subject.name || idx}>
                    <td className="py-2.5 px-3 font-medium text-white">
                      <input
                        type="text"
                        required
                        value={subject.name}
                        onChange={(e) => updateSubject(idx, 'name', e.target.value)}
                        className="min-w-56 px-2 py-1.5 bg-slate-900 border border-slate-700 rounded text-white focus:outline-none focus:border-indigo-500"
                      />
                    </td>
                    {['score', 'attendance', 'assignmentCompletion'].map((field) => (
                      <td key={field} className="py-2.5 px-3">
                        <input
                          type="number"
                          min={0}
                          max={100}
                          step="0.1"
                          required
                          value={subject[field]}
                          onChange={(e) => updateSubject(idx, field, e.target.value)}
                          className="w-24 px-2 py-1.5 bg-slate-900 border border-slate-700 rounded text-white focus:outline-none focus:border-indigo-500"
                        />
                      </td>
                    ))}
                    <td className="py-2.5 px-3 text-right">
                      <button
                        type="button"
                        onClick={() => removeSubject(idx)}
                        title="Remove Subject"
                        className="p-1.5 text-slate-400 hover:text-rose-400 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium inline-flex items-center gap-2 disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          <span>{saving ? 'Saving Academic Data...' : 'Save Academic Data'}</span>
        </button>
      </form>
    </div>
  );
}
