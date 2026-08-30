'use client';

import { useAuth } from '@/lib/auth-context';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Search, Filter, Eye, Clock, Copy, Check, BarChart3, Trash2, ShieldAlert, Edit3, X, CheckSquare, Square, AlertCircle } from 'lucide-react';

export default function DashboardLinks() {
  const { token } = useAuth();
  const [linksList, setLinksList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // all, active, inactive, expired

  // Actions states
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Edit Link states
  const [editLink, setEditLink] = useState<any | null>(null);
  const [editOriginalUrl, setEditOriginalUrl] = useState('');
  const [editCustomAlias, setEditCustomAlias] = useState('');
  const [editIsActive, setEditIsActive] = useState(true);
  const [editExpirationOption, setEditExpirationOption] = useState('never');
  const [editCustomExpiryDate, setEditCustomExpiryDate] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateError, setUpdateError] = useState<string | null>(null);

  const fetchLinks = async () => {
    if (!token) return;
    setLoading(true);
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
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLinks();
  }, [token]);

  const handleCopy = (id: number, shortCode: string) => {
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://pintas.link';
    const fullUrl = `${origin}/${shortCode}`;
    navigator.clipboard.writeText(fullUrl);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDelete = (id: number) => {
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

  const handleEditClick = (link: any) => {
    setEditLink(link);
    setEditOriginalUrl(link.originalUrl);
    setEditCustomAlias(link.customAlias || '');
    setEditIsActive(link.isActive);
    
    if (link.expiresAt) {
      setEditExpirationOption('custom');
      // Format to YYYY-MM-DD
      const expDate = new Date(link.expiresAt);
      setEditCustomExpiryDate(expDate.toISOString().split('T')[0]);
    } else {
      setEditExpirationOption('never');
      setEditCustomExpiryDate('');
    }
    setUpdateError(null);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editLink || !token) return;
    setIsUpdating(true);
    setUpdateError(null);

    try {
      const res = await fetch(`/api/links/${editLink.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          originalUrl: editOriginalUrl,
          customAlias: editCustomAlias.trim() || null,
          isActive: editIsActive,
          expirationOption: editExpirationOption,
          customExpiryDate: editExpirationOption === 'custom' ? editCustomExpiryDate : null,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal memperbarui tautan');

      // Update in local state list
      setLinksList(linksList.map((l) => (l.id === editLink.id ? data : l)));
      setEditLink(null);
    } catch (err: any) {
      setUpdateError(err.message);
    } finally {
      setIsUpdating(false);
    }
  };

  // Filtering Logic
  const filteredLinks = linksList.filter((link) => {
    // 1. Search Query
    const searchLower = searchQuery.toLowerCase();
    const matchesSearch =
      link.shortCode.toLowerCase().includes(searchLower) ||
      link.originalUrl.toLowerCase().includes(searchLower) ||
      (link.customAlias && link.customAlias.toLowerCase().includes(searchLower));

    if (!matchesSearch) return false;

    // 2. Status Filter
    const isExpired = link.expiresAt && new Date(link.expiresAt) < new Date();
    if (statusFilter === 'active') {
      return link.isActive && !isExpired;
    } else if (statusFilter === 'inactive') {
      return !link.isActive;
    } else if (statusFilter === 'expired') {
      return isExpired;
    }

    return true;
  });

  return (
    <div className="space-y-6 font-sans text-slate-900" id="dashboard-links-list">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Semua Tautan</h1>
          <p className="text-slate-500 text-sm mt-1">Kelola, sunting, dan hapus seluruh tautan penyingkat Anda.</p>
        </div>
      </div>

      {/* Search and Filters Bar */}
      <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-sm flex flex-col md:flex-row gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Cari berdasarkan kode, alias, atau URL asli..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 focus:bg-white transition-all font-medium"
          />
        </div>

        {/* Filter Status */}
        <div className="flex items-center gap-2">
          <Filter size={14} className="text-slate-400 flex-shrink-0" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-medium"
          >
            <option value="all">Semua Status</option>
            <option value="active">Aktif</option>
            <option value="inactive">Nonaktif</option>
            <option value="expired">Expired</option>
          </select>
        </div>
      </div>

      {/* Main Table / List Card */}
      <div className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-20 flex justify-center">
            <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : error ? (
          <div className="py-20 text-center text-rose-500 text-xs font-semibold">{error}</div>
        ) : filteredLinks.length === 0 ? (
          <div className="py-20 text-center text-slate-400 text-xs font-medium">Tidak ada tautan yang cocok dengan kriteria pencarian Anda.</div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredLinks.map((link) => {
              const shortPath = link.customAlias || link.shortCode;
              const isExpired = link.expiresAt && new Date(link.expiresAt) < new Date();
              return (
                <div key={link.id} className="p-4 sm:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-indigo-50/10 transition-all">
                  <div className="min-w-0 flex-1 space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-bold text-sm text-slate-800">/{shortPath}</span>
                      {isExpired ? (
                        <span className="px-2 py-0.5 bg-amber-50 text-amber-600 border border-amber-100 rounded-lg text-[9px] font-bold uppercase tracking-wider">
                          Expired
                        </span>
                      ) : link.isActive ? (
                        <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 border border-indigo-100 rounded-lg text-[9px] font-bold uppercase tracking-wider">
                          Aktif
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 bg-rose-50 text-rose-600 border border-rose-100 rounded-lg text-[9px] font-bold uppercase tracking-wider">
                          Nonaktif
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-400 truncate max-w-xl font-medium">
                      URL Asli: <a href={link.originalUrl} target="_blank" rel="noopener noreferrer" className="hover:text-indigo-600 underline">{link.originalUrl}</a>
                    </p>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-[10px] text-slate-400 font-medium">
                      <span className="flex items-center gap-1">
                        <Clock size={10} />
                        <span>Dibuat: {new Date(link.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                      </span>
                      {link.expiresAt && (
                        <span className="flex items-center gap-1">
                          <Clock size={10} />
                          <span>Masa Berlaku: {new Date(link.expiresAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions Column */}
                  <div className="flex items-center justify-between md:justify-end gap-6 border-t md:border-t-0 border-slate-100 pt-3 md:pt-0">
                    {/* Clicks */}
                    <div className="text-right">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Klik</span>
                      <span className="text-sm font-bold text-slate-800">{link.clickCount.toLocaleString()}</span>
                    </div>

                    <div className="flex gap-1.5 border-l border-slate-200 pl-4">
                      <button
                        onClick={() => handleCopy(link.id, shortPath)}
                        className="p-1.5 hover:bg-slate-100 rounded text-slate-500 hover:text-indigo-600 transition-all"
                        title="Salin"
                      >
                        {copiedId === link.id ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                      </button>
                      <Link
                        href={`/dashboard/links/${link.id}`}
                        className="p-1.5 hover:bg-slate-100 rounded text-slate-500 hover:text-indigo-600 transition-all"
                        title="Statistik"
                      >
                        <BarChart3 size={14} />
                      </Link>
                      <button
                        onClick={() => handleEditClick(link)}
                        className="p-1.5 hover:bg-slate-100 rounded text-slate-500 hover:text-indigo-600 transition-all"
                        title="Edit"
                      >
                        <Edit3 size={14} />
                      </button>
                      <button
                        onClick={() => handleDelete(link.id)}
                        className="p-1.5 hover:bg-rose-50 rounded text-slate-400 hover:text-rose-600 transition-all"
                        title="Hapus"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Edit Link Modal Popup */}
      {editLink && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-6" id="edit-link-modal">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-md w-full p-6 space-y-4 shadow-xl shadow-slate-100">
            <div className="flex justify-between items-center border-b border-slate-100 pb-2">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-widest">Sunting Tautan</h3>
              <button onClick={() => setEditLink(null)} className="p-1 hover:bg-indigo-50 rounded-lg text-slate-400 hover:text-indigo-600 transition-colors">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleUpdate} className="space-y-4">
              {updateError && (
                <div className="p-3 bg-rose-50/50 border border-rose-100 rounded-xl text-rose-600 text-xs flex gap-1.5 items-start">
                  <AlertCircle size={14} className="flex-shrink-0 mt-0.5 text-rose-500" />
                  <p className="font-medium">{updateError}</p>
                </div>
              )}

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">URL Asli</label>
                <input
                  type="text"
                  value={editOriginalUrl}
                  onChange={(e) => setEditOriginalUrl(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 focus:bg-white transition-all font-medium"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Custom Alias</label>
                <input
                  type="text"
                  value={editCustomAlias}
                  onChange={(e) => setEditCustomAlias(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 focus:bg-white transition-all font-medium"
                />
              </div>

              {/* Toggle isActive */}
              <div className="flex items-center justify-between py-1 bg-slate-50 px-3 border border-slate-100 rounded-xl">
                <span className="text-xs font-bold text-slate-700">Status Tautan</span>
                <button
                  type="button"
                  onClick={() => setEditIsActive(!editIsActive)}
                  className="flex items-center gap-1.5 text-xs font-bold text-slate-600"
                >
                  {editIsActive ? (
                    <span className="text-indigo-600 flex items-center gap-1">
                      <CheckSquare size={16} />
                      <span>Aktif</span>
                    </span>
                  ) : (
                    <span className="text-rose-500 flex items-center gap-1">
                      <Square size={16} />
                      <span>Nonaktif</span>
                    </span>
                  )}
                </button>
              </div>

              {/* Expiration Settings */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Masa Berlaku</label>
                  <select
                    value={editExpirationOption}
                    onChange={(e) => setEditExpirationOption(e.target.value)}
                    className="w-full px-2 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 font-medium"
                  >
                    <option value="never">Tidak Pernah</option>
                    <option value="1d">1 Hari</option>
                    <option value="7d">7 Hari</option>
                    <option value="30d">30 Hari</option>
                    <option value="custom">Custom Tanggal</option>
                  </select>
                </div>

                {editExpirationOption === 'custom' && (
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Tanggal</label>
                    <input
                      type="date"
                      value={editCustomExpiryDate}
                      onChange={(e) => setEditCustomExpiryDate(e.target.value)}
                      className="w-full px-2 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 font-medium"
                    />
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditLink(null)}
                  disabled={isUpdating}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isUpdating}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white text-xs font-bold rounded-xl transition-all shadow-lg shadow-indigo-100 disabled:opacity-50"
                >
                  {isUpdating ? 'Memproses...' : 'Simpan Perubahan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteId !== null && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-6" id="delete-link-confirm">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-sm w-full p-6 space-y-4 shadow-xl shadow-slate-100">
            <h3 className="text-sm font-bold text-rose-600 uppercase tracking-widest">Konfirmasi Hapus</h3>
            <p className="text-xs text-slate-600 leading-relaxed font-medium">
              Apakah Anda yakin ingin menghapus tautan pendek ini? Tindakan ini tidak dapat dibatalkan.
            </p>
            <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
              <button onClick={() => setDeleteId(null)} disabled={isDeleting} className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors">
                Batal
              </button>
              <button onClick={confirmDelete} disabled={isDeleting} className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl transition-colors flex items-center gap-1 shadow-lg shadow-rose-100">
                {isDeleting ? 'Menghapus...' : 'Ya, Hapus'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
