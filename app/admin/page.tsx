'use client';

import { useAuth } from '@/lib/auth-context';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ShieldAlert,
  Users,
  Link2,
  Eye,
  Slash,
  Trash2,
  Check,
  AlertTriangle,
  ArrowLeft,
  X,
  FileText,
  Plus,
  AlertCircle,
  ToggleLeft,
  ToggleRight,
  ShieldCheck,
  CheckCircle,
} from 'lucide-react';

export default function AdminDashboard() {
  const { user, dbUser, token, loading: authLoading } = useAuth();
  const router = useRouter();

  // Dashboard Stats & Lists
  const [adminData, setAdminData] = useState<any | null>(null);
  const [loadingStats, setLoadingStats] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Active Admin Tab
  const [activeTab, setActiveTab] = useState('overview'); // overview, links, reports, blacklist, users

  // Action loading states
  const [actionId, setActionId] = useState<number | null>(null);

  // Blacklist form state
  const [newDomain, setNewDomain] = useState('');
  const [blacklistReason, setBlacklistReason] = useState('');
  const [blacklistError, setBlacklistError] = useState<string | null>(null);

  const fetchAdminStats = async () => {
    if (!token) return;
    setLoadingStats(true);
    try {
      const res = await fetch('/api/admin/stats', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal memuat panel administrator');
      setAdminData(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoadingStats(false);
    }
  };

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.push('/login');
      } else if (dbUser && dbUser.role !== 'admin') {
        router.push('/dashboard');
      } else if (dbUser && dbUser.role === 'admin') {
        fetchAdminStats();
      }
    }
  }, [user, dbUser, authLoading, router, token]);

  // Actions
  const handleToggleLink = async (linkId: number, currentActive: boolean) => {
    if (!token) return;
    setActionId(linkId);
    try {
      const res = await fetch(`/api/links/${linkId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ isActive: !currentActive }),
      });
      if (!res.ok) throw new Error();
      // Update local state list
      const updatedList = adminData.links.map((l: any) =>
        l.id === linkId ? { ...l, isActive: !currentActive } : l
      );
      setAdminData({ ...adminData, links: updatedList });
    } catch (err) {
      alert('Gagal memperbarui status tautan.');
    } finally {
      setActionId(null);
    }
  };

  const handleDeleteLink = async (linkId: number) => {
    if (!token || !confirm('Yakin ingin menghapus tautan ini permanen?')) return;
    setActionId(linkId);
    try {
      const res = await fetch(`/api/links/${linkId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error();
      setAdminData({
        ...adminData,
        links: adminData.links.filter((l: any) => l.id !== linkId),
      });
    } catch (err) {
      alert('Gagal menghapus tautan.');
    } finally {
      setActionId(null);
    }
  };

  const handleResolveReport = async (reportId: number, status: 'resolved' | 'ignored') => {
    if (!token) return;
    try {
      const res = await fetch(`/api/admin/reports/${reportId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error();
      
      const updatedReports = adminData.reports.map((r: any) =>
        r.id === reportId ? { ...r, status } : r
      );
      setAdminData({ ...adminData, reports: updatedReports });
    } catch (err) {
      alert('Gagal memproses laporan.');
    }
  };

  const handleAddBlacklist = async (e: React.FormEvent) => {
    e.preventDefault();
    setBlacklistError(null);
    if (!newDomain.trim()) return;

    try {
      const res = await fetch('/api/admin/blacklist', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          domain: newDomain,
          reason: blacklistReason.trim() || 'Melanggar Pedoman',
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal menambahkan domain ke daftar hitam');

      setAdminData({
        ...adminData,
        blacklist: [data, ...adminData.blacklist],
      });
      setNewDomain('');
      setBlacklistReason('');
    } catch (err: any) {
      setBlacklistError(err.message);
    }
  };

  const handleRemoveBlacklist = async (blacklistId: number) => {
    if (!token) return;
    try {
      const res = await fetch(`/api/admin/blacklist/${blacklistId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error();
      setAdminData({
        ...adminData,
        blacklist: adminData.blacklist.filter((b: any) => b.id !== blacklistId),
      });
    } catch (err) {
      alert('Gagal menghapus domain dari daftar hitam.');
    }
  };

  if (authLoading || loadingStats) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50 font-sans">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-600 text-sm font-semibold">Menyiapkan Panel Administrator...</p>
        </div>
      </div>
    );
  }

  if (error || !adminData) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 font-sans">
        <div className="bg-white border border-slate-200 p-8 rounded-3xl max-w-md w-full text-center space-y-4 shadow-sm">
          <ShieldAlert size={48} className="text-rose-500 mx-auto" />
          <h1 className="text-lg font-bold text-slate-900">Akses Ditolak / Gagal Memuat</h1>
          <p className="text-xs text-slate-500">{error || 'Anda tidak diizinkan masuk ke halaman admin.'}</p>
          <Link href="/dashboard" className="inline-flex px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold transition-all">
            Kembali ke Dashboard
          </Link>
        </div>
      </div>
    );
  }

  const { stats, links, reports, blacklist, users } = adminData;

  const tabItems = [
    { id: 'overview', name: 'Ringkasan' },
    { id: 'links', name: 'Semua Tautan' },
    { id: 'reports', name: 'Laporan Abuse' },
    { id: 'blacklist', name: 'Blacklist Domain' },
    { id: 'users', name: 'Pengguna' },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900" id="admin-shell">
      {/* Top Bar Navigation */}
      <header className="border-b border-slate-100 bg-white sticky top-0 z-40 px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard" className="p-1.5 hover:bg-slate-50 rounded-lg text-slate-500 hover:text-indigo-600 transition-colors">
            <ArrowLeft size={16} />
          </Link>
          <div className="flex items-center gap-2">
            <div className="px-2.5 py-0.5 bg-indigo-50 text-indigo-700 border border-indigo-100 rounded text-[10px] font-extrabold uppercase tracking-widest flex items-center gap-1">
              <ShieldCheck size={12} />
              <span>Admin Panel</span>
            </div>
          </div>
        </div>

        <Link href="/" className="flex items-center gap-2">
          <div className="w-7 h-7 bg-indigo-600 text-white rounded-lg flex items-center justify-center font-extrabold text-sm shadow-md shadow-indigo-100">PL</div>
          <span className="text-sm font-extrabold tracking-tight text-slate-900">Pintas Link</span>
        </Link>
      </header>

      {/* Main Body */}
      <main className="flex-1 max-w-6xl w-full mx-auto p-6 md:p-10 space-y-8">
        
        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-200 overflow-x-auto gap-1">
          {tabItems.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-3 text-xs font-extrabold whitespace-nowrap border-b-2 transition-all ${
                activeTab === tab.id
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-slate-400 hover:text-slate-700'
              }`}
            >
              {tab.name}
            </button>
          ))}
        </div>

        {/* Tab 1: Overview */}
        {activeTab === 'overview' && (
          <div className="space-y-6 animate-fade-in">
            {/* System Metrics Bento Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div className="bg-white border border-slate-200 p-6 rounded-3xl shadow-sm flex items-center gap-4">
                <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center shadow-inner">
                  <Users size={20} />
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Pengguna Sistem</span>
                  <p className="text-3xl font-extrabold text-slate-950 mt-0.5">{stats.totalUsers}</p>
                </div>
              </div>

              <div className="bg-white border border-slate-200 p-6 rounded-3xl shadow-sm flex items-center gap-4">
                <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center shadow-inner">
                  <Link2 size={20} />
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Tautan Pendek</span>
                  <p className="text-3xl font-extrabold text-slate-950 mt-0.5">{stats.totalLinks}</p>
                </div>
              </div>

              <div className="bg-white border border-slate-200 p-6 rounded-3xl shadow-sm flex items-center gap-4">
                <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center shadow-inner">
                  <Eye size={20} />
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Total Redirect</span>
                  <p className="text-3xl font-extrabold text-slate-950 mt-0.5">{stats.totalClicks.toLocaleString()}</p>
                </div>
              </div>
            </div>

            {/* Pending Reports Callout */}
            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                <ShieldAlert size={16} className="text-rose-500" />
                <span className="text-sm font-bold text-slate-800">Laporan Abuse Baru</span>
              </div>

              {reports.filter((r: any) => r.status === 'pending').length === 0 ? (
                <div className="text-center py-6 text-slate-400 text-xs font-semibold">Semua bersih! Tidak ada laporan pending.</div>
              ) : (
                <div className="space-y-3">
                  {reports
                    .filter((r: any) => r.status === 'pending')
                    .slice(0, 3)
                    .map((rep: any) => (
                      <div key={rep.id} className="p-4 bg-rose-50/50 border border-rose-100 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <span className="px-1.5 py-0.5 bg-rose-100 text-rose-800 text-[9px] font-bold uppercase rounded">
                            {rep.reason}
                          </span>
                          <p className="text-xs font-bold text-slate-800 mt-1">/{rep.shortCode}</p>
                          <p className="text-[10px] text-slate-500 truncate mt-0.5 font-medium">Laporan: {rep.description}</p>
                        </div>
                        <button
                          onClick={() => setActiveTab('reports')}
                          className="px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-[10px] font-bold rounded-lg self-end sm:self-auto transition-colors shadow-sm"
                        >
                          Tindak Lanjuti
                        </button>
                      </div>
                    ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 2: All Links */}
        {activeTab === 'links' && (
          <div className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden animate-fade-in" id="admin-links">
            <div className="p-5 border-b border-slate-100">
              <span className="text-sm font-extrabold text-slate-800">Manajemen Semua Tautan Sistem</span>
            </div>

            <div className="divide-y divide-slate-100">
              {links.map((link: any) => (
                <div key={link.id} className="p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-50/40 transition-colors">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-bold text-sm text-slate-900">/{link.customAlias || link.shortCode}</span>
                      <span className={`px-2 py-0.5 rounded-lg text-[9px] font-bold uppercase tracking-widest ${
                        link.isActive ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-rose-50 text-rose-600 border border-rose-100'
                      }`}>
                        {link.isActive ? 'Aktif' : 'Nonaktif'}
                      </span>
                    </div>
                    <p className="text-xs font-medium text-slate-500 truncate mt-1.5">Asli: {link.originalUrl}</p>
                    <p className="text-[10px] font-semibold text-slate-400 mt-1">Pembuat: {link.userEmail || 'Anonymous'} | Klik: {link.clickCount}</p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleToggleLink(link.id, link.isActive)}
                      disabled={actionId === link.id}
                      className={`px-3 py-2 rounded-xl text-[10px] font-bold flex items-center gap-1 transition-all shadow-sm ${
                        link.isActive
                          ? 'bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-100'
                          : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-100'
                      }`}
                    >
                      {link.isActive ? 'Deaktivasi' : 'Aktivasi'}
                    </button>
                    <button
                      onClick={() => handleDeleteLink(link.id)}
                      disabled={actionId === link.id}
                      className="p-2 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-100 rounded-xl transition-colors shadow-sm"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 3: Reports */}
        {activeTab === 'reports' && (
          <div className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden animate-fade-in" id="admin-reports">
            <div className="p-5 border-b border-slate-100">
              <span className="text-sm font-extrabold text-slate-800">Daftar Pengaduan Penyalahgunaan (Abuse Reports)</span>
            </div>

            {reports.length === 0 ? (
              <div className="py-20 text-center text-slate-400 text-xs font-semibold">Belum ada laporan pengaduan yang dikirim.</div>
            ) : (
              <div className="divide-y divide-slate-100">
                {reports.map((rep: any) => (
                  <div key={rep.id} className="p-5 space-y-3 hover:bg-slate-50/40 transition-colors">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="px-1.5 py-0.5 bg-rose-100 text-rose-800 text-[9px] font-bold uppercase rounded">
                          {rep.reason}
                        </span>
                        <span className="font-extrabold text-sm text-slate-900">/{rep.shortCode}</span>
                      </div>
                      
                      <span className={`px-2 py-0.5 rounded-lg text-[9px] font-bold uppercase tracking-widest ${
                        rep.status === 'pending'
                          ? 'bg-amber-50 text-amber-700 border border-amber-100'
                          : rep.status === 'resolved'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                          : 'bg-slate-50 text-slate-500 border border-slate-200'
                      }`}>
                        {rep.status}
                      </span>
                    </div>

                    <div className="space-y-1.5">
                      <p className="text-xs text-slate-700 leading-relaxed font-semibold">&ldquo; {rep.description} &rdquo;</p>
                      <p className="text-[10px] text-slate-500 font-medium">Target URL: <span className="break-all font-semibold text-slate-700">{rep.originalUrl}</span></p>
                      <p className="text-[9px] text-slate-400 font-semibold">Dilaporkan: {new Date(rep.createdAt).toLocaleString('id-ID')}</p>
                    </div>

                    {rep.status === 'pending' && (
                      <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                        <button
                          onClick={() => handleResolveReport(rep.id, 'ignored')}
                          className="px-3 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-600 text-[10px] font-bold rounded-xl border border-slate-200 transition-all shadow-sm"
                        >
                          Abaikan
                        </button>
                        <button
                          onClick={() => handleResolveReport(rep.id, 'resolved')}
                          className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-bold rounded-xl flex items-center gap-1 transition-all shadow-sm"
                        >
                          <Check size={10} />
                          <span>Tandai Selesai</span>
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 4: Blacklist Domain */}
        {activeTab === 'blacklist' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-fade-in" id="admin-blacklist">
            {/* Form */}
            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm h-fit space-y-4">
              <div className="flex items-center gap-1.5 text-slate-900 font-bold text-sm border-b border-slate-100 pb-3">
                <Plus size={16} className="text-indigo-600" />
                <span>Blokir Domain Baru</span>
              </div>

              <form onSubmit={handleAddBlacklist} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Domain URL</label>
                  <input
                    type="text"
                    placeholder="shadywebsite.com"
                    value={newDomain}
                    onChange={(e) => setNewDomain(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs placeholder-slate-400 text-slate-800 font-semibold focus:outline-none focus:ring-4 focus:ring-indigo-100 focus:bg-white focus:border-indigo-500 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Alasan Pemblokiran</label>
                  <input
                    type="text"
                    placeholder="Indikasi Phishing Akun"
                    value={blacklistReason}
                    onChange={(e) => setBlacklistReason(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs placeholder-slate-400 text-slate-800 font-semibold focus:outline-none focus:ring-4 focus:ring-indigo-100 focus:bg-white focus:border-indigo-500 transition-all"
                  />
                </div>

                {blacklistError && (
                  <div className="p-3 bg-rose-50 border border-rose-100 rounded-xl text-rose-600 text-[10px] font-semibold">
                    {blacklistError}
                  </div>
                )}

                <button
                  type="submit"
                  className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition-all shadow-lg shadow-indigo-100"
                >
                  Tambahkan ke Blacklist
                </button>
              </form>
            </div>

            {/* List */}
            <div className="lg:col-span-2 bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden flex flex-col">
              <div className="p-5 border-b border-slate-100">
                <span className="text-xs font-extrabold text-slate-800">Daftar Hitam Domain Terblokir</span>
              </div>

              {blacklist.length === 0 ? (
                <div className="py-20 text-center text-slate-400 text-xs font-semibold">Belum ada domain yang diblokir.</div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {blacklist.map((item: any) => (
                    <div key={item.id} className="p-4 flex items-center justify-between gap-4 hover:bg-slate-50/40 transition-colors">
                      <div>
                        <span className="font-bold text-xs text-rose-600 font-mono">{item.domain}</span>
                        <p className="text-[10px] text-slate-400 font-medium mt-0.5">Alasan: {item.reason}</p>
                      </div>
                      <button
                        onClick={() => handleRemoveBlacklist(item.id)}
                        className="p-1.5 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-lg transition-colors"
                        title="Hapus pemblokiran"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 5: Users */}
        {activeTab === 'users' && (
          <div className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden animate-fade-in" id="admin-users">
            <div className="p-5 border-b border-slate-100">
              <span className="text-sm font-extrabold text-slate-800">Daftar Pengguna Terdaftar</span>
            </div>

            <div className="divide-y divide-slate-100">
              {users.map((u: any) => (
                <div key={u.id} className="p-4 flex items-center justify-between gap-4 hover:bg-slate-50/40 transition-colors">
                  <div>
                    <span className="font-extrabold text-sm text-slate-900">{u.name || 'User'}</span>
                    <p className="text-xs font-medium text-slate-500 mt-0.5">{u.email}</p>
                    <p className="text-[10px] font-semibold text-slate-400 mt-1">Terdaftar: {new Date(u.createdAt).toLocaleDateString('id-ID')}</p>
                  </div>

                  <span className={`px-2.5 py-1 rounded-lg text-[9px] font-bold uppercase tracking-widest ${
                    u.role === 'admin' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-indigo-50/50 text-indigo-700 border border-indigo-100'
                  }`}>
                    {u.role}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
