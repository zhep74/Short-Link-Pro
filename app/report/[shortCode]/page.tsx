'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { ShieldAlert, AlertCircle, CheckCircle2, ArrowLeft } from 'lucide-react';

interface ReportPageProps {
  params: Promise<{ shortCode: string }>;
}

export default function ReportPage({ params }: ReportPageProps) {
  const { shortCode } = use(params);
  const [reason, setReason] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!reason) {
      setError('Harap pilih alasan pelaporan.');
      return;
    }

    if (!description.trim()) {
      setError('Harap masukkan deskripsi detail laporan.');
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          shortCode,
          reason,
          description,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Gagal mengirim laporan.');
      }

      setSuccess(data.message);
      setReason('');
      setDescription('');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 px-6 py-12" id="report-page">
      <div className="max-w-md w-full bg-white rounded-2xl border border-slate-200/80 shadow-md p-8 md:p-10">
        
        {/* Back navigation */}
        <Link href="/" className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 mb-6 transition-colors">
          <ArrowLeft size={12} />
          <span>Kembali ke Beranda</span>
        </Link>

        {/* Header */}
        <div className="mb-8">
          <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center mb-4">
            <ShieldAlert size={24} />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Laporkan Tautan Penyalahgunaan</h1>
          <p className="text-sm text-slate-500 mt-1">
            Bantu kami menjaga keamanan platform. Silakan laporkan tautan <code className="bg-slate-100 text-slate-800 px-1.5 py-0.5 rounded text-xs font-mono font-semibold">{shortCode}</code> jika melanggar ketentuan.
          </p>
        </div>

        {/* Success State */}
        {success ? (
          <div className="space-y-6 text-center py-4" id="report-success">
            <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 size={32} />
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-bold text-slate-900">Laporan Terkirim</h3>
              <p className="text-xs text-slate-500 leading-relaxed">{success}</p>
            </div>
            <Link
              href="/"
              className="inline-flex w-full items-center justify-center rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 transition-colors shadow-sm"
            >
              Kembali ke Beranda
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-4 bg-rose-50 border border-rose-100 rounded-xl text-rose-600 text-xs flex gap-2 items-start" id="report-error">
                <AlertCircle size={16} className="text-rose-500 flex-shrink-0 mt-0.5" />
                <p className="leading-normal">{error}</p>
              </div>
            )}

            {/* Reason */}
            <div>
              <label htmlFor="reason-select" className="block text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wider">
                Alasan Pelaporan
              </label>
              <select
                id="reason-select"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full px-3 py-3 bg-slate-50/50 border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 transition-all"
              >
                <option value="">-- Pilih Alasan --</option>
                <option value="Phishing">Phishing (Penipuan Pencurian Data)</option>
                <option value="Malware">Malware (Penyebaran Virus/Aplikasi Bahaya)</option>
                <option value="Spam">Spam (Tautan Iklan Massal)</option>
                <option value="Scam">Scam (Penipuan Keuangan)</option>
                <option value="Konten ilegal">Konten Ilegal / Melanggar Hukum</option>
              </select>
            </div>

            {/* Description */}
            <div>
              <label htmlFor="description-input" className="block text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wider">
                Deskripsi Detail Laporan
              </label>
              <textarea
                id="description-input"
                rows={4}
                placeholder="Berikan informasi tambahan atau bukti pendukung mengapa tautan ini berbahaya..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3 py-3 bg-slate-50/50 border border-slate-200 rounded-xl text-xs placeholder-slate-400 text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 focus:bg-white transition-all"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full flex items-center justify-center bg-rose-600 hover:bg-rose-700 text-white font-semibold py-3.5 rounded-xl text-sm transition-all shadow-sm focus:outline-none focus:ring-2 focus:ring-rose-500/10 disabled:opacity-50"
            >
              {isSubmitting ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                'Kirim Laporan Penyalahgunaan'
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
