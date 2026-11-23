import React, { useState, useEffect, useRef } from 'react';
import {
  FolderLock,
  UploadCloud,
  Search,
  FileText,
  Lock,
  Sparkles,
  Eye,
  X,
  ShieldCheck,
  Trash2,
  Download,
  AlertCircle,
  RotateCcw,
} from 'lucide-react';
import { usePatient } from '../../context/PatientContext';
import { recordsService } from '../../api/recordsService';
import { MedicalRecord } from '../../types';
import { formatDate, cn } from '../../lib/utils';

export const RecordsPage: React.FC = () => {
  const { activePatient } = usePatient();
  const [activeTab, setActiveTab] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRecord, setSelectedRecord] = useState<MedicalRecord | null>(null);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);

  // ── Records loaded from backend ──
  const [records, setRecords] = useState<MedicalRecord[]>([]);
  const [isLoadingRecords, setIsLoadingRecords] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // ── Upload form state ──
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<'lab' | 'prescription' | 'radiology' | 'consultation'>('lab');
  const [doctor, setDoctor] = useState('');
  const [facility, setFacility] = useState('');
  const [summary, setSummary] = useState('');
  const [reportDate, setReportDate] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [retryingId, setRetryingId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleRetryExtraction = async (recordId: string) => {
    setRetryingId(recordId);
    try {
      const updated = await recordsService.retryExtraction(recordId);
      setRecords((prev) => prev.map((r) => (r.id === recordId ? updated : r)));
    } catch (err: any) {
      alert(err?.response?.data?.message || err?.message || 'Failed to retry extraction. Please re-upload the document.');
    } finally {
      setRetryingId(null);
    }
  };

  // ── Load documents from backend on mount ──
  useEffect(() => {
    loadDocuments();
  }, [activePatient?.id]);

  const loadDocuments = async () => {
    setIsLoadingRecords(true);
    setLoadError(null);
    try {
      const docs = await recordsService.getMyDocuments();
      setRecords(docs);
    } catch (err: any) {
      console.error('Failed to load documents', err);
      // Fall back to activePatient.recentRecords if available
      if (activePatient?.recentRecords?.length) {
        setRecords(activePatient.recentRecords);
      } else {
        setLoadError('Could not load documents. Please try again.');
      }
    } finally {
      setIsLoadingRecords(false);
    }
  };

  if (!activePatient) return null;

  const filteredRecords = records.filter((rec) => {
    const matchesTab = activeTab === 'all' || rec.category === activeTab;
    const q = searchQuery.toLowerCase();
    const matchesQuery =
      !q ||
      rec.title.toLowerCase().includes(q) ||
      rec.facility?.toLowerCase().includes(q) ||
      rec.doctor?.toLowerCase().includes(q) ||
      rec.tags?.some((t) => t.toLowerCase().includes(q));
    return matchesTab && matchesQuery;
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file size (25MB max)
      if (file.size > 25 * 1024 * 1024) {
        setUploadError('File size must be under 25 MB.');
        return;
      }
      setSelectedFile(file);
      setUploadError(null);
      // Auto-fill title from filename if empty
      if (!title) {
        const name = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
        setTitle(name);
      }
    }
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      setUploadError('Please select a file to upload.');
      return;
    }
    if (!title.trim()) {
      setUploadError('Please enter a document title.');
      return;
    }

    setIsUploading(true);
    setUploadError(null);
    try {
      const newRecord = await recordsService.uploadDocument(
        selectedFile,
        title.trim(),
        category,
        doctor.trim(),
        facility.trim(),
        summary.trim(),
        reportDate || undefined,
      );

      // Add to top of list
      setRecords((prev) => [newRecord, ...prev]);

      // Reset form
      setIsUploadModalOpen(false);
      setTitle('');
      setDoctor('');
      setFacility('');
      setSummary('');
      setReportDate('');
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (err: any) {
      console.error('Error uploading document', err);
      setUploadError(err?.response?.data?.error || err?.message || 'Upload failed. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (recordId: string) => {
    if (!confirm('Delete this document permanently?')) return;
    try {
      await recordsService.deleteDocument(recordId);
      setRecords((prev) => prev.filter((r) => r.id !== recordId));
      if (selectedRecord?.id === recordId) setSelectedRecord(null);
    } catch (err) {
      console.error('Failed to delete document', err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-emerald-100 px-3 py-0.5 text-xs font-bold text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 flex items-center gap-1">
              <Lock className="h-3 w-3" /> Zero-Knowledge Client Encryption
            </span>
          </div>
          <h1 className="mt-1 text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <FolderLock className="h-7 w-7 text-teal-600 dark:text-teal-400" />
            Medical Records Vault
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Secure DigiLocker &amp; ABHA repository for {activePatient.name}
          </p>
        </div>

        <button
          onClick={() => setIsUploadModalOpen(true)}
          className="flex items-center gap-2 rounded-2xl bg-teal-600 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-teal-600/30 hover:bg-teal-700 self-start sm:self-auto"
        >
          <UploadCloud className="h-4 w-4" /> Upload New Record
        </button>
      </div>

      {/* Search & Tabs */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 space-y-4">
        <div className="relative">
          <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search records by title, doctor, facility, or tag…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 py-2.5 text-sm text-slate-900 focus:border-teal-500 focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
          />
        </div>

        <div className="flex flex-wrap gap-2 pt-1 border-t border-slate-100 dark:border-slate-800">
          {[
            { id: 'all', label: 'All Records' },
            { id: 'lab', label: 'Lab Reports' },
            { id: 'radiology', label: 'Imaging & Scans' },
            { id: 'consultation', label: 'Doctor Notes' },
            { id: 'prescription', label: 'Prescriptions' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'rounded-xl px-4 py-2 text-xs font-semibold transition-all',
                activeTab === tab.id
                  ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 font-bold'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300'
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Loading State */}
      {isLoadingRecords && (
        <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center dark:border-slate-800 dark:bg-slate-900">
          <div className="animate-pulse text-slate-400">Loading documents…</div>
        </div>
      )}

      {/* Error State */}
      {loadError && !isLoadingRecords && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center dark:border-red-800 dark:bg-red-950/30">
          <AlertCircle className="mx-auto h-8 w-8 text-red-400" />
          <p className="mt-2 text-sm text-red-600 dark:text-red-400">{loadError}</p>
          <button
            onClick={loadDocuments}
            className="mt-3 rounded-xl bg-red-600 px-4 py-2 text-xs font-bold text-white hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      )}

      {/* Records Grid */}
      {!isLoadingRecords && !loadError && filteredRecords.length === 0 && (
        <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center dark:border-slate-800 dark:bg-slate-900">
          <FileText className="mx-auto h-12 w-12 text-slate-300" />
          <h3 className="mt-3 text-base font-bold text-slate-700 dark:text-slate-300">
            No records found
          </h3>
          <p className="mt-1 text-xs text-slate-500">
            {records.length === 0
              ? 'Upload your first medical record to get started.'
              : 'Try adjusting your search filter or upload a new record.'}
          </p>
        </div>
      )}

      {!isLoadingRecords && filteredRecords.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredRecords.map((record) => (
            <div
              key={record.id}
              className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-sm hover:border-teal-300 transition-all dark:border-slate-800 dark:bg-slate-900"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="rounded-lg bg-teal-50 px-2.5 py-1 text-xs font-bold uppercase text-teal-700 dark:bg-teal-950 dark:text-teal-300">
                    {record.category}
                  </span>
                  <div className="flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400">
                    <Lock className="h-3.5 w-3.5" />
                    <span className="font-semibold">AES-256</span>
                  </div>
                </div>

                <h3 className="mt-3 text-base font-bold text-slate-900 dark:text-white">
                  {record.title}
                </h3>
                {(record.facility || record.doctor) && (
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    {[record.facility, record.doctor].filter(Boolean).join(' • ')}
                  </p>
                )}
                <p className="mt-0.5 text-xs text-slate-400">
                  Date: {formatDate(record.date)}
                </p>

                {record.summary && (
                  <p className="mt-2.5 text-xs text-slate-600 dark:text-slate-300 line-clamp-2">
                    {record.summary}
                  </p>
                )}

                {/* AI Extracted Findings */}
                {record.aiKeyFindings?.[0] && !record.tags?.includes('failed') && (
                  <div className="mt-3 rounded-xl bg-slate-50 p-2.5 dark:bg-slate-800/60 text-xs">
                    <div className="font-semibold text-teal-700 dark:text-teal-400 flex items-center gap-1 text-[11px]">
                      <Sparkles className="h-3 w-3" /> AI Extracted Finding:
                    </div>
                    <p className="mt-0.5 text-[11px] text-slate-600 dark:text-slate-300 line-clamp-1">
                      {record.aiKeyFindings[0]}
                    </p>
                  </div>
                )}

                {/* Extraction Failed "Try Again" Option */}
                {record.tags?.includes('failed') && (
                  <div className="mt-3 rounded-xl bg-amber-50 p-2.5 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 flex items-center justify-between text-xs">
                    <span className="text-amber-800 dark:text-amber-300 font-semibold text-[11px] flex items-center gap-1">
                      <AlertCircle className="h-3 w-3 text-amber-600 shrink-0" />
                      Extraction incomplete
                    </span>
                    <button
                      onClick={() => handleRetryExtraction(record.id)}
                      disabled={retryingId === record.id}
                      className="rounded-lg bg-amber-600 px-2.5 py-1 text-[11px] font-bold text-white hover:bg-amber-700 disabled:opacity-50 flex items-center gap-1 transition-colors"
                    >
                      <RotateCcw className={cn("h-3 w-3", retryingId === record.id && "animate-spin")} />
                      {retryingId === record.id ? 'Retrying…' : 'Try again'}
                    </button>
                  </div>
                )}
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <div className="flex flex-wrap gap-1">
                  {record.tags?.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>

                <div className="flex items-center gap-2">
                  {record.fileUrl && (
                    <a
                      href={record.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-slate-400 hover:text-teal-600"
                      title="Download file"
                    >
                      <Download className="h-3.5 w-3.5" />
                    </a>
                  )}
                  <button
                    onClick={() => setSelectedRecord(record)}
                    className="flex items-center gap-1 text-xs font-bold text-teal-600 hover:text-teal-700 dark:text-teal-400"
                  >
                    <Eye className="h-3.5 w-3.5" /> View
                  </button>
                  <button
                    onClick={() => handleDelete(record.id)}
                    className="text-slate-400 hover:text-red-500"
                    title="Delete"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Record Details Modal */}
      {selectedRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-2xl rounded-3xl bg-white p-6 shadow-2xl dark:bg-slate-900 dark:border dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <span className="rounded-lg bg-teal-100 px-2.5 py-1 text-xs font-bold uppercase text-teal-800 dark:bg-teal-950 dark:text-teal-300">
                  {selectedRecord.category}
                </span>
                <span className="text-xs text-slate-400">
                  {formatDate(selectedRecord.date)}
                </span>
              </div>
              <button
                onClick={() => setSelectedRecord(null)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
              {selectedRecord.title}
            </h2>
            {(selectedRecord.doctor || selectedRecord.facility) && (
              <p className="text-xs text-slate-500">
                {selectedRecord.doctor && `Provider: ${selectedRecord.doctor}`}
                {selectedRecord.doctor && selectedRecord.facility && ' • '}
                {selectedRecord.facility && `Facility: ${selectedRecord.facility}`}
              </p>
            )}

            {selectedRecord.summary && (
              <div className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-800/50">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Clinical Overview
                </h4>
                <p className="mt-1 text-sm text-slate-700 dark:text-slate-300">
                  {selectedRecord.summary}
                </p>
              </div>
            )}

            {selectedRecord.aiKeyFindings?.length > 0 && (
              <div className="rounded-2xl border border-teal-100 bg-teal-50/50 p-4 dark:border-teal-900/40 dark:bg-teal-950/20">
                <h4 className="text-xs font-bold uppercase tracking-wider text-teal-700 dark:text-teal-400 flex items-center gap-1.5">
                  <Sparkles className="h-4 w-4" /> AI Synthesized Findings
                </h4>
                <ul className="mt-2 space-y-1.5 text-xs text-slate-700 dark:text-slate-300">
                  {selectedRecord.aiKeyFindings.map((finding, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="mt-1 h-1.5 w-1.5 rounded-full bg-teal-500 shrink-0" />
                      <span>{finding}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="flex items-center justify-between pt-2">
              <div className="flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400 font-semibold">
                <ShieldCheck className="h-4 w-4" /> ABDM &amp; HIPAA Cryptographic Assurance
              </div>
              <div className="flex items-center gap-2">
                {selectedRecord.fileUrl && (
                  <a
                    href={selectedRecord.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-xl bg-teal-600 px-4 py-2 text-xs font-bold text-white hover:bg-teal-700"
                  >
                    Download File
                  </a>
                )}
                <button
                  onClick={() => setSelectedRecord(null)}
                  className="rounded-xl bg-slate-900 px-4 py-2 text-xs font-bold text-white dark:bg-slate-100 dark:text-slate-900"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Upload Record Modal */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl dark:bg-slate-900 dark:border dark:border-slate-800 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <UploadCloud className="h-5 w-5 text-teal-600" />
                Upload Medical Record
              </h2>
              <button
                onClick={() => { setIsUploadModalOpen(false); setUploadError(null); }}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleUploadSubmit} className="space-y-3">
              {/* File Dropzone */}
              <div
                onClick={() => fileInputRef.current?.click()}
                className={cn(
                  'rounded-2xl border-2 border-dashed p-6 text-center cursor-pointer transition-colors',
                  selectedFile
                    ? 'border-teal-500 bg-teal-50/50 dark:border-teal-600 dark:bg-teal-950/20'
                    : 'border-teal-300 bg-teal-50/30 dark:border-teal-800 dark:bg-teal-950/10 hover:border-teal-400'
                )}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png,.webp,.heic"
                  onChange={handleFileChange}
                  className="hidden"
                />
                {selectedFile ? (
                  <>
                    <FileText className="mx-auto h-8 w-8 text-teal-600" />
                    <p className="mt-2 text-xs font-bold text-teal-700 dark:text-teal-300">
                      {selectedFile.name}
                    </p>
                    <p className="text-[11px] text-slate-500">
                      {(selectedFile.size / 1024 / 1024).toFixed(2)} MB • Click to change
                    </p>
                  </>
                ) : (
                  <>
                    <UploadCloud className="mx-auto h-8 w-8 text-teal-600" />
                    <p className="mt-2 text-xs font-bold text-slate-700 dark:text-slate-300">
                      Click to select PDF, JPEG, or PNG file
                    </p>
                    <p className="text-[11px] text-slate-500">
                      Max 25 MB
                    </p>
                  </>
                )}
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Document Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Blood Sugar Test or MRI Brain"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Category
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as any)}
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  >
                    <option value="lab">Lab Report</option>
                    <option value="radiology">Radiology / Imaging</option>
                    <option value="consultation">Consultation Note</option>
                    <option value="prescription">Prescription</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Report Date
                  </label>
                  <input
                    type="date"
                    value={reportDate}
                    onChange={(e) => setReportDate(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Doctor Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., Dr. R. K. Gupta"
                    value={doctor}
                    onChange={(e) => setDoctor(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Hospital / Diagnostic Center
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., Max Diagnostics"
                    value={facility}
                    onChange={(e) => setFacility(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Clinical Summary or Key Values (Optional)
                </label>
                <textarea
                  rows={2}
                  placeholder="Enter key numbers or doctor notes…"
                  value={summary}
                  onChange={(e) => setSummary(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>

              {/* Error */}
              {uploadError && (
                <div className="rounded-xl bg-red-50 p-3 text-xs text-red-600 dark:bg-red-950/30 dark:text-red-400 flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  {uploadError}
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => { setIsUploadModalOpen(false); setUploadError(null); }}
                  className="rounded-xl px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUploading || !selectedFile}
                  className="flex items-center gap-1.5 rounded-xl bg-teal-600 px-5 py-2 text-xs font-bold text-white hover:bg-teal-700 disabled:opacity-50"
                >
                  {isUploading ? 'Uploading…' : 'Save to Vault'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
