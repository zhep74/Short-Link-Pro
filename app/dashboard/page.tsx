'use client';

import { useAuth } from '@/lib/auth-context';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'motion/react';
import { Link2, Eye, Calendar, Clock, Sparkles, Copy, Check, ExternalLink, Trash2, BarChart3, Plus, AlertCircle } from 'lucide-react';

export default function DashboardOverview() {
  const { token, dbUser } = useAuth();
  const [linksList, setLinksList] = useState<any[]>([]);
  const [loadingLinks, setLoadingLinks] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form states inside Dashboard
  const [originalUrl, setOriginalUrl] = useState('');
  const [customAlias, setCustomAlias] = useState('');
  const [expirationOption, setExpirationOption] = useState('never');
  const [customExpiryDate, setCustomExpiryDate] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<any | null>(null);
  const [copiedLink, setCopiedLink] = useState<number | null>(null);

  // Delete modal state
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchLinks = async () => {
    if (!token) return;
    setLoadingLinks(true);
    try {
      const res = await fetch('/api/links', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal mengambil tautan.');
      setLinksList(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoadingLinks(false);
    }
  };

  useEffect(() => {
    fetchLinks();
  }, [token]);

  const handleShorten = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFormSuccess(null);

    if (!originalUrl.trim()) {
      setFormError('Masukkan URL asli terlebih dahulu.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/links', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          originalUrl,
          customAlias: customAlias.trim() || null,
          expirationOption,
          customExpiryDate: expirationOption === 'custom' ? customExpiryDate : null,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal membuat tautan.');

      setFormSuccess(data);
      setOriginalUrl('');
      setCustomAlias('');
      setExpirationOption('never');
      fetchLinks(); // reload links list
    } catch (err: any) {
      setFormError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopy = (id: number, shortCode: string) => {
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://pintas.link';
    const fullUrl = `${origin}/${shortCode}`;
    navigator.clipboard.writeText(fullUrl);
    setCopiedLink(id);
    setTimeout(() => setCopiedLink(null), 2000);
  };

  const handleDeleteClick = (id: number) => {
    setDeleteId(id);
  };

  const confirmDelete = async () => {
    if (!deleteId || !token) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/links/${deleteId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Gagal menghapus tautan');
      setLinksList(linksList.filter((l) => l.id !== deleteId));
      setDeleteId(null);
    } catch (err) {
      console.error(err);
      alert('Gagal menghapus tautan');
    } finally {
      setIsDeleting(false);
    }
  };

  // Metrics calculations
  const totalShortLinks = linksList.length;
  const totalClicks = linksList.reduce((acc, curr) => acc + curr.clickCount, 0);
  const activeLinks = linksList.filter((l) => l.isActive && (!l.expiresAt || new Date(l.expiresAt) >= new Date())).length;
  const expiredLinks = linksList.filter((l) => l.expiresAt && new Date(l.expiresAt) < new Date()).length;

  return (
    <div className="space-y-8 font-sans text-slate-900" id="dashboard-overview">
      {/* Header section */}
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">Ringkasan Statistik</h1>
        <p className="text-slate-500 text-sm mt-1">Pantau kinerja tautan pendek Anda dan perpendek URL baru secara instan.</p>
      </div>

      {/* Metrics Bento Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Total Tautan</span>
          <p className="text-3xl font-extrabold text-slate-900 tracking-tight mt-1">{totalShortLinks}</p>
        </div>
        <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Total Klik</span>
          <p className="text-3xl font-extrabold text-slate-900 tracking-tight mt-1">{totalClicks.toLocaleString()}</p>
        </div>
        <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Tautan Aktif</span>
          <p className="text-3xl font-extrabold text-indigo-600 tracking-tight mt-1">{activeLinks}</p>
        </div>
        <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Tautan Expired</span>
          <p className="text-3xl font-extrabold text-amber-600 tracking-tight mt-1">{expiredLinks}</p>
        </div>
      </div>

      {/* Main content grids */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Quick shorten URL container */}
        <div className="lg:col-span-1 bg-white border border-slate-200 rounded-2xl shadow-sm p-6 space-y-4 h-fit">
          <div className="flex items-center gap-1.5 text-indigo-600 font-bold text-sm border-b border-slate-100 pb-3 uppercase tracking-wider">
            <Plus size={16} />
            <span>Perpendek Tautan Baru</span>
          </div>

          <form onSubmit={handleShorten} className="space-y-4">
            <div>
              <label htmlFor="dash-url-input" className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                URL Asli
              </label>
              <input
                id="dash-url-input"
                type="text"
                placeholder="https://example.com/artikel"
                value={originalUrl}
                onChange={(e) => setOriginalUrl(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl text-xs placeholder-slate-400 text-slate-800 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 focus:bg-white transition-all font-medium"
              />
            </div>

            <div>
              <label htmlFor="dash-alias-input" className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                Custom Alias (Opsional)
              </label>
              <input
                id="dash-alias-input"
                type="text"
                placeholder="diskon-promo"
                value={customAlias}
                onChange={(e) => setCustomAlias(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl text-xs placeholder-slate-400 text-slate-800 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 focus:bg-white transition-all font-medium"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label htmlFor="dash-expiry-select" className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Masa Berlaku
                </label>
                <select
                  id="dash-expiry-select"
                  value={expirationOption}
                  onChange={(e) => setExpirationOption(e.target.value)}
                  className="w-full px-2 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-medium"
                >
                  <option value="never">Seterusnya</option>
                  <option value="1d">1 Hari</option>
                  <option value="7d">7 Hari</option>
                  <option value="30d">30 Hari</option>
                  <option value="custom">Custom</option>
                </select>
              </div>

              {expirationOption === 'custom' && (
                <div>
                  <label htmlFor="dash-expiry-date" className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Tanggal
                  </label>
                  <input
                    id="dash-expiry-date"
                    type="date"
                    min={new Date().toISOString().split('T')[0]}
                    value={customExpiryDate}
                    onChange={(e) => setCustomExpiryDate(e.target.value)}
                    className="w-full px-2 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-medium"
                  />
                </div>
              )}
            </div>

            {formError && (
              <div className="p-3 bg-rose-50/50 border border-rose-100 rounded-xl text-rose-600 text-[10px] flex gap-1.5 items-start">
                <AlertCircle size={12} className="flex-shrink-0 mt-0.5 text-rose-500" />
                <p className="font-medium">{formError}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-bold text-xs rounded-xl shadow-lg shadow-indigo-100 transition-all focus:outline-none focus:ring-4 focus:ring-indigo-500/20 disabled:opacity-50"
            >
              {isSubmitting ? 'Memproses...' : 'Perpendek'}
            </button>
          </form>

          {/* Form success banner */}
          <AnimatePresence>
            {formSuccess && (
              <motion.div
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                className="p-4 bg-indigo-950 text-white rounded-2xl space-y-2 mt-2 text-[11px] border border-indigo-900 shadow-md"
              >
                <div className="font-semibold text-indigo-200">Berhasil Dibuat:</div>
                <div className="bg-white/10 p-2.5 rounded-lg border border-white/10 break-all font-mono text-indigo-100">
                  {typeof window !== 'undefined' ? window.location.origin : 'pintas.link'}/
                  {formSuccess.customAlias || formSuccess.shortCode}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Recent links table */}
        <div className="lg:col-span-2 bg-white border border-slate-200/80 rounded-2xl shadow-sm p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <span className="text-slate-900 font-bold text-sm">Tautan Terkini</span>
            <Link href="/dashboard/links" className="text-[10px] font-bold text-indigo-600 hover:text-indigo-700 transition-colors uppercase tracking-widest">
              Lihat Semua →
            </Link>
          </div>

          {loadingLinks ? (
            <div className="py-12 flex justify-center">
              <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : error ? (
            <div className="text-center py-12 text-rose-500 text-xs font-semibold">Gagal mengambil data tautan: {error}</div>
          ) : linksList.length === 0 ? (
            <div className="text-center py-12 text-slate-400 text-xs font-medium">Anda belum membuat tautan pendek apapun.</div>
          ) : (
            <div className="space-y-3">
              {linksList.slice(0, 5).map((link) => {
                const shortPath = link.customAlias || link.shortCode;
                const isExpired = link.expiresAt && new Date(link.expiresAt) < new Date();
                return (
                  <div
                    key={link.id}
                    className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3.5 border border-slate-100 rounded-2xl hover:bg-indigo-50/20 transition-all gap-3"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-slate-800 truncate">/{shortPath}</span>
                        {isExpired ? (
                          <span className="px-1.5 py-0.5 bg-amber-50 text-amber-600 border border-amber-100 rounded-lg text-[9px] font-bold uppercase tracking-wider">
                            Expired
                          </span>
                        ) : link.isActive ? (
                          <span className="px-1.5 py-0.5 bg-indigo-50 text-indigo-700 border border-indigo-100 rounded-lg text-[9px] font-bold uppercase tracking-wider">
                            Aktif
                          </span>
                        ) : (
                          <span className="px-1.5 py-0.5 bg-rose-50 text-rose-600 border border-rose-100 rounded-lg text-[9px] font-bold uppercase tracking-wider">
                            Nonaktif
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-slate-400 truncate mt-1 max-w-[280px] font-medium">Asli: {link.originalUrl}</p>
                    </div>

                    <div className="flex items-center gap-4 text-[11px] text-slate-500 self-stretch sm:self-auto justify-between sm:justify-end border-t sm:border-t-0 border-slate-100 pt-2 sm:pt-0">
                      <div className="flex items-center gap-1 font-bold text-slate-600" title="Jumlah klik">
                        <Eye size={12} className="text-slate-400" />
                        <span>{link.clickCount}</span>
                      </div>

                      <div className="flex items-center gap-1 text-slate-400 font-medium">
                        <Clock size={12} />
                        <span>
                          {new Date(link.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                        </span>
                      </div>

                      <div className="flex items-center gap-1 border-l border-slate-200 pl-3">
                        <button
                          onClick={() => handleCopy(link.id, shortPath)}
                          className="p-1 hover:bg-slate-100 rounded text-slate-500 hover:text-indigo-600 transition-all"
                          title="Salin"
                        >
                          {copiedLink === link.id ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
                        </button>
                        <Link
                          href={`/dashboard/links/${link.id}`}
                          className="p-1 hover:bg-slate-100 rounded text-slate-500 hover:text-indigo-600 transition-all"
                          title="Statistik & Detail"
                        >
                          <BarChart3 size={12} />
                        </Link>
                        <button
                          onClick={() => handleDeleteClick(link.id)}
                          className="p-1 hover:bg-rose-50 rounded text-slate-400 hover:text-rose-600 transition-all"
                          title="Hapus"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Confirmation Delete Modal */}
      {deleteId !== null && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-6" id="delete-confirm-modal">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-sm w-full p-6 space-y-4 shadow-xl shadow-slate-100">
            <h3 className="text-sm font-bold text-rose-600 uppercase tracking-widest">Konfirmasi Hapus</h3>
            <p className="text-xs text-slate-600 leading-relaxed font-medium">
              Apakah Anda yakin ingin menghapus tautan pendek ini? Tindakan ini bersifat permanen dan seluruh data statistik klik akan ikut terhapus.
            </p>
            <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
              <button
                onClick={() => setDeleteId(null)}
                disabled={isDeleting}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors"
              >
                Batal
              </button>
              <button
                onClick={confirmDelete}
                disabled={isDeleting}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl transition-colors flex items-center gap-1.5 shadow-lg shadow-rose-100"
              >
                {isDeleting ? 'Menghapus...' : 'Ya, Hapus'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
