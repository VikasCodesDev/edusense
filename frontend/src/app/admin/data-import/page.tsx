'use client';

import React, { useState, useRef } from 'react';
import api from '@/lib/api';
import {
  Upload,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  ArrowRight,
  Database,
  RefreshCw,
  FileText,
  Info,
  Check
} from 'lucide-react';

export default function DataImportPage() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [previewData, setPreviewData] = useState<any>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setPreviewData(null);
      setImportResult(null);
      setError(null);
    }
  };

  const handleRunValidation = async () => {
    if (!file) return;

    try {
      setAnalyzing(true);
      setError(null);
      const formData = new FormData();
      formData.append('file', file);

      const res = await api.post('/admin/import/preview', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (res.data.success) {
        setPreviewData(res.data);
      } else {
        setError(res.data.error || 'Failed to process dataset.');
      }
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'Error processing uploaded file.');
    } finally {
      setAnalyzing(false);
    }
  };

  const handleLoadSampleDataset = async () => {
    try {
      setAnalyzing(true);
      setError(null);
      // Fetch sample records from the server
      const res = await api.get('/faculty/students?limit=50');
      if (res.data.success && res.data.students) {
        const rawRecords = res.data.students.map((s: any) => ({
          student_id: s.studentId,
          name: s.name,
          email: s.email,
          course: s.course,
          semester: s.semester,
          attendance_pct: s.attendancePct,
          assignment_completion_rate: s.assignmentCompletionRate,
          assignment_avg_score: s.assignmentAvgScore ?? 75,
          internal_test_avg: s.internalTestAvg,
          previous_exam_score: s.previousExamScore,
          performance_trend: s.performanceTrend,
          score_dsa: s.subjects?.[0]?.score ?? s.internalTestAvg,
          score_dbms: s.subjects?.[1]?.score ?? s.internalTestAvg,
          score_maths: s.subjects?.[2]?.score ?? s.internalTestAvg,
          score_os: s.subjects?.[3]?.score ?? s.internalTestAvg,
          score_cn: s.subjects?.[4]?.score ?? s.internalTestAvg
        }));

        // Add 2 deliberate edge cases for validation showcase
        rawRecords.push({
          student_id: 'EDU2024TEST99',
          name: 'Invalid Attendance Test',
          email: 'test@edu.com',
          course: 'B.Tech CS',
          semester: 4,
          attendance_pct: 115.0, // Invalid > 100%
          assignment_completion_rate: 80,
          internal_test_avg: 70
        });

        const previewRes = await api.post('/admin/import/preview', { records: rawRecords });
        if (previewRes.data.success) {
          setPreviewData(previewRes.data);
        }
      }
    } catch (err: any) {
      setError(err.message || 'Error loading sample dataset.');
    } finally {
      setAnalyzing(false);
    }
  };

  const handleConfirmImport = async () => {
    if (!previewData || !previewData.validation || !previewData.validation.all_valid_records) return;

    try {
      setImporting(true);
      setError(null);
      const res = await api.post('/admin/import/confirm', {
        filename: previewData.filename || 'institutional_batch.csv',
        validRecords: previewData.validation.all_valid_records
      });

      if (res.data.success) {
        setImportResult(res.data);
      } else {
        setError(res.data.error || 'Import failed.');
      }
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'Error confirming import.');
    } finally {
      setImporting(false);
    }
  };

  const validation = previewData?.validation;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fade-in">
      
      {/* Header */}
      <div>
        <span className="text-xs font-mono uppercase tracking-widest text-indigo-400">Data Engineering Pipeline</span>
        <h1 className="text-2xl sm:text-3xl font-bold text-white mt-1">Institutional Data Ingestion Studio</h1>
        <p className="text-xs sm:text-sm text-slate-400">
          Upload real college academic records (CSV / Excel), validate constraints, map fields, and execute ML risk scoring.
        </p>
      </div>

      {/* Success Notification */}
      {importResult && (
        <div className="subtle-card rounded-2xl p-6 border border-emerald-500/40 bg-emerald-950/20 space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <Check className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Dataset Ingested Successfully!</h3>
              <p className="text-xs text-slate-300">{importResult.message}</p>
            </div>
          </div>
          <p className="text-xs text-emerald-400 font-mono">
            Batch ML Risk Predictions updated across all imported student records.
          </p>
        </div>
      )}

      {/* Upload Dropzone & Controls */}
      <div className="subtle-card rounded-2xl p-6 sm:p-8 border border-slate-800 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div className="space-y-1">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Upload className="w-4 h-4 text-indigo-400" />
              <span>Step 1: Upload College Academic File</span>
            </h3>
            <p className="text-xs text-slate-400">Supports .CSV, .XLSX, and .XLS formats with dynamic column headers</p>
          </div>

          <button
            type="button"
            onClick={handleLoadSampleDataset}
            disabled={analyzing}
            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-medium inline-flex items-center gap-1.5 transition-colors"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-indigo-400" />
            <span>Load Sample College Batch (50 rows)</span>
          </button>
        </div>

        {/* File Dropzone */}
        <div
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-slate-700 hover:border-indigo-500 rounded-xl p-8 text-center cursor-pointer bg-slate-900/40 hover:bg-slate-900/80 transition-all space-y-3"
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv, .xlsx, .xls"
            onChange={handleFileChange}
            className="hidden"
          />
          <div className="w-12 h-12 rounded-xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center mx-auto">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-semibold text-white">
              {file ? file.name : 'Click to select CSV or Excel dataset file'}
            </p>
            <p className="text-xs text-slate-500 mt-1">
              {file ? `${(file.size / 1024).toFixed(1)} KB` : 'or drag and drop institutional student records'}
            </p>
          </div>
        </div>

        {file && (
          <div className="flex justify-end">
            <button
              onClick={handleRunValidation}
              disabled={analyzing}
              className="px-5 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs inline-flex items-center gap-2 shadow-sm transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${analyzing ? 'animate-spin' : ''}`} />
              <span>{analyzing ? 'Inspecting & Validating...' : 'Validate Dataset'}</span>
            </button>
          </div>
        )}
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Validation Report & Preview */}
      {previewData && validation && (
        <div className="space-y-6">
          
          {/* Validation Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="subtle-card rounded-xl p-4 border border-slate-800">
              <span className="text-[11px] uppercase font-mono text-slate-400">Total Records</span>
              <p className="text-2xl font-bold font-mono text-white mt-1">{validation.total_records}</p>
            </div>
            <div className="subtle-card rounded-xl p-4 border border-emerald-500/30 bg-emerald-950/10">
              <span className="text-[11px] uppercase font-mono text-emerald-400">Valid Records</span>
              <p className="text-2xl font-bold font-mono text-emerald-400 mt-1">{validation.valid_count}</p>
            </div>
            <div className="subtle-card rounded-xl p-4 border border-rose-500/30 bg-rose-950/10">
              <span className="text-[11px] uppercase font-mono text-rose-400">Invalid Records</span>
              <p className="text-2xl font-bold font-mono text-rose-400 mt-1">{validation.invalid_count}</p>
            </div>
            <div className="subtle-card rounded-xl p-4 border border-amber-500/30 bg-amber-950/10">
              <span className="text-[11px] uppercase font-mono text-amber-400">Duplicate Warnings</span>
              <p className="text-2xl font-bold font-mono text-amber-400 mt-1">{validation.duplicate_count}</p>
            </div>
          </div>

          {/* Validation Errors Inspector */}
          {validation.validation_errors && validation.validation_errors.length > 0 && (
            <div className="subtle-card rounded-2xl p-6 border border-rose-500/30 bg-rose-950/10 space-y-4">
              <div className="flex items-center gap-2 text-rose-300 font-bold text-sm">
                <AlertTriangle className="w-4 h-4 text-rose-400" />
                <span>Validation Errors Detected ({validation.validation_errors.length} rows excluded)</span>
              </div>
              <p className="text-xs text-slate-400">
                The following rows violated institutional academic integrity constraints and will be skipped:
              </p>

              <div className="space-y-2 text-xs">
                {validation.validation_errors.map((err: any, idx: number) => (
                  <div key={idx} className="p-3 bg-slate-900/80 rounded-lg border border-rose-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <span className="font-mono text-rose-400 font-semibold">Row #{err.row_number} (ID: {err.student_id}):</span>{' '}
                      <span className="text-slate-300">{err.errors.join('; ')}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Sanitized Data Preview Table */}
          <div className="subtle-card rounded-2xl p-6 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-white">Sanitized Records Preview</h3>
                <p className="text-xs text-slate-400">Showing first 10 sanitized records ready for import</p>
              </div>

              <button
                onClick={handleConfirmImport}
                disabled={importing || validation.valid_count === 0}
                className="px-5 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs inline-flex items-center gap-2 shadow-lg shadow-emerald-500/20 transition-colors disabled:opacity-50"
              >
                <Database className="w-3.5 h-3.5" />
                <span>{importing ? 'Importing & Scoring ML...' : `Confirm Import of ${validation.valid_count} Records`}</span>
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="text-[11px] uppercase tracking-wider text-slate-400 bg-slate-900/60 border-b border-slate-800">
                  <tr>
                    <th className="py-2.5 px-3">Student ID</th>
                    <th className="py-2.5 px-3">Name</th>
                    <th className="py-2.5 px-3">Attendance</th>
                    <th className="py-2.5 px-3">Internal Test</th>
                    <th className="py-2.5 px-3">Assignments</th>
                    <th className="py-2.5 px-3">Trend</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 font-mono">
                  {(validation.preview_valid_records || []).map((row: any, idx: number) => (
                    <tr key={idx} className="hover:bg-slate-800/40">
                      <td className="py-2.5 px-3 text-white font-semibold">{row.student_id || row.roll_no}</td>
                      <td className="py-2.5 px-3 font-sans">{row.name || 'Student'}</td>
                      <td className="py-2.5 px-3">{row.attendance_pct}%</td>
                      <td className="py-2.5 px-3">{row.internal_test_avg}%</td>
                      <td className="py-2.5 px-3">{row.assignment_completion_rate}%</td>
                      <td className="py-2.5 px-3">{row.performance_trend}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

    </div>
  );
}
