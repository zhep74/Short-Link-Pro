'use client';

import { useAuth } from '@/lib/auth-context';
import { useEffect, useState, use } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Calendar,
  Eye,
  Globe,
  Monitor,
  Chrome,
  Compass,
  ArrowUpRight,
  Link as LinkIcon,
  Clock,
  ExternalLink,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
  PieChart,
  Pie,
} from 'recharts';

interface StatsPageProps {
  params: Promise<{ id: string }>;
}

const COLORS = ['#4f46e5', '#6366f1', '#818cf8', '#a5b4fc', '#c7d2fe', '#e0e7ff'];

export default function LinkStatsPage({ params }: StatsPageProps) {
  const { id } = use(params);
  const { token } = useAuth();
  const [statsData, setStatsData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      if (!token) return;
      try {
        const res = await fetch(`/api/links/${id}/stats`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Gagal memuat statistik');
        setStatsData(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [id, token]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-500 text-xs font-semibold">Memuat data analisis...</p>
        </div>
      </div>
    );
  }

  if (error || !statsData) {
    return (
      <div className="space-y-6">
        <Link href="/dashboard/links" className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 hover:text-indigo-700">
          <ArrowLeft size={12} />
          <span>Kembali ke Daftar</span>
        </Link>
        <div className="p-6 bg-rose-50/50 border border-rose-100 rounded-3xl text-rose-600 text-xs text-center font-bold">
          Error: {error || 'Data statistik tidak tersedia.'}
        </div>
      </div>
    );
  }

  const { link, summary, charts } = statsData;
  const shortUrl = typeof window !== 'undefined' ? `${window.location.origin}/${link.customAlias || link.shortCode}` : `/${link.customAlias || link.shortCode}`;

  return (
    <div className="space-y-8" id="link-stats-view">
      {/* Back button and title */}
      <div className="space-y-4">
        <Link href="/dashboard/links" className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 hover:text-indigo-700 transition-colors">
          <ArrowLeft size={12} />
          <span>Kembali ke Tautan Saya</span>
        </Link>
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Analisis Tautan</h1>
            <p className="text-slate-500 text-sm truncate max-w-xl mt-1">
              Memantau aktivitas pengunjung untuk <span className="font-mono font-bold bg-indigo-50/50 px-2 py-0.5 rounded-lg text-indigo-700">/{link.customAlias || link.shortCode}</span>
            </p>
          </div>
          <a
            href={shortUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition-all shadow-lg shadow-indigo-100"
          >
            <span>Buka Link Pendek</span>
            <ExternalLink size={12} />
          </a>
        </div>
      </div>

      {/* Target Link Information */}
      <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm space-y-2">
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Tujuan URL Asli</span>
        <a
          href={link.originalUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs font-bold text-slate-700 hover:text-indigo-600 hover:underline flex items-center gap-1.5 break-all"
        >
          <span>{link.originalUrl}</span>
          <ArrowUpRight size={12} className="flex-shrink-0" />
        </a>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 p-5 rounded-3xl shadow-sm">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Total Klik</span>
          <p className="text-3xl font-extrabold text-slate-900 mt-1">{summary.totalClicks.toLocaleString()}</p>
        </div>
        <div className="bg-white border border-slate-200 p-5 rounded-3xl shadow-sm">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Klik Hari Ini</span>
          <p className="text-3xl font-extrabold text-slate-900 mt-1">{summary.clicksToday}</p>
        </div>
        <div className="bg-white border border-slate-200 p-5 rounded-3xl shadow-sm">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Klik 7 Hari Terakhir</span>
          <p className="text-3xl font-extrabold text-slate-900 mt-1">{summary.clicksLast7Days}</p>
        </div>
        <div className="bg-white border border-slate-200 p-5 rounded-3xl shadow-sm">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Dibuat Pada</span>
          <p className="text-sm font-bold text-slate-700 mt-3.5">
            {new Date(summary.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
          </p>
        </div>
      </div>

      {/* Main Timeline Chart */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
        <div className="flex items-center gap-1.5 text-slate-900 font-bold text-sm">
          <Calendar size={16} className="text-indigo-600" />
          <span>Tren Kunjungan (7 Hari Terakhir)</span>
        </div>
        
        <div className="h-64 md:h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={charts.timeline} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorClicks" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.2}/>
                  <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="date" tickLine={false} axisLine={false} style={{ fontSize: '10px', fill: '#94a3b8' }} />
              <YAxis tickLine={false} axisLine={false} style={{ fontSize: '10px', fill: '#94a3b8' }} allowDecimals={false} />
              <Tooltip
                contentStyle={{ backgroundColor: '#1e1b4b', borderRadius: '16px', border: 'none', color: '#fff', fontSize: '11px' }}
                labelStyle={{ fontWeight: 'bold' }}
              />
              <Area type="monotone" dataKey="clicks" name="Klik" stroke="#4f46e5" strokeWidth={3} fillOpacity={1} fill="url(#colorClicks)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Breakdown grids */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Country Breakdown */}
        <div className="bg-white border border-slate-200 p-6 rounded-3xl shadow-sm space-y-4 flex flex-col justify-between">
          <div className="flex items-center gap-1.5 text-slate-900 font-bold text-sm border-b border-slate-100 pb-3">
            <Globe size={16} className="text-indigo-600" />
            <span>Negara Pengunjung</span>
          </div>

          {charts.countries.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-xs font-semibold">Belum ada data negara.</div>
          ) : (
            <div className="flex-1 flex flex-col md:flex-row items-center justify-between gap-6">
              {/* Table */}
              <div className="w-full md:w-1/2 space-y-2">
                {charts.countries.slice(0, 5).map((item: any, idx: number) => (
                  <div key={item.name} className="flex items-center justify-between text-xs py-1">
                    <span className="text-slate-600 font-medium">{item.name}</span>
                    <span className="font-bold text-slate-800">{item.value} ({((item.value / summary.totalClicks) * 100).toFixed(0)}%)</span>
                  </div>
                ))}
              </div>
              {/* Pie Chart */}
              <div className="w-full md:w-1/2 h-40 flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={charts.countries} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={60} fill="#4f46e5">
                      {charts.countries.map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ fontSize: '11px', borderRadius: '12px' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </div>

        {/* Devices Breakdown */}
        <div className="bg-white border border-slate-200 p-6 rounded-3xl shadow-sm space-y-4 flex flex-col justify-between">
          <div className="flex items-center gap-1.5 text-slate-900 font-bold text-sm border-b border-slate-100 pb-3">
            <Monitor size={16} className="text-indigo-600" />
            <span>Perangkat Pengunjung</span>
          </div>

          {charts.devices.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-xs font-semibold">Belum ada data perangkat.</div>
          ) : (
            <div className="flex-1 flex flex-col md:flex-row items-center justify-between gap-6">
              {/* Table */}
              <div className="w-full md:w-1/2 space-y-2">
                {charts.devices.map((item: any, idx: number) => (
                  <div key={item.name} className="flex items-center justify-between text-xs py-1">
                    <span className="text-slate-600 font-medium capitalize">{item.name}</span>
                    <span className="font-bold text-slate-800">{item.value} ({((item.value / summary.totalClicks) * 100).toFixed(0)}%)</span>
                  </div>
                ))}
              </div>
              {/* Bar Chart */}
              <div className="w-full md:w-1/2 h-40">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={charts.devices} layout="vertical" margin={{ left: -30, top: 10, bottom: 0 }}>
                    <XAxis type="number" hide />
                    <YAxis dataKey="name" type="category" style={{ fontSize: '10px', textTransform: 'capitalize' }} />
                    <Tooltip contentStyle={{ fontSize: '10px' }} />
                    <Bar dataKey="value" fill="#4f46e5" radius={[0, 4, 4, 0]}>
                      {charts.devices.map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </div>

        {/* Browsers & OS */}
        <div className="bg-white border border-slate-200 p-6 rounded-3xl shadow-sm space-y-4">
          <div className="flex items-center gap-1.5 text-slate-900 font-bold text-sm border-b border-slate-100 pb-3">
            <Chrome size={16} className="text-indigo-600" />
            <span>Browser &amp; Sistem Operasi</span>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-3">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Browser</span>
              {charts.browsers.length === 0 ? (
                <span className="text-xs text-slate-400 font-semibold">Belum ada data</span>
              ) : (
                charts.browsers.slice(0, 5).map((item: any) => (
                  <div key={item.name} className="flex items-center justify-between text-xs">
                    <span className="text-slate-600 truncate max-w-[80%] font-semibold">{item.name}</span>
                    <span className="font-bold text-slate-800">{item.value}</span>
                  </div>
                ))
              )}
            </div>

            <div className="space-y-3 border-l border-slate-100 pl-4">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Sistem Operasi</span>
              {charts.os.length === 0 ? (
                <span className="text-xs text-slate-400 font-semibold">Belum ada data</span>
              ) : (
                charts.os.slice(0, 5).map((item: any) => (
                  <div key={item.name} className="flex items-center justify-between text-xs">
                    <span className="text-slate-600 truncate max-w-[80%] font-semibold">{item.name}</span>
                    <span className="font-bold text-slate-800">{item.value}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Referrer Breakdown */}
        <div className="bg-white border border-slate-200 p-6 rounded-3xl shadow-sm space-y-4">
          <div className="flex items-center gap-1.5 text-slate-900 font-bold text-sm border-b border-slate-100 pb-3">
            <Compass size={16} className="text-indigo-600" />
            <span>Perujuk (Referrer)</span>
          </div>

          {charts.referrers.length === 0 ? (
            <div className="py-6 text-center text-slate-400 text-xs font-semibold">Belum ada data referer.</div>
          ) : (
            <div className="space-y-2">
              {charts.referrers.slice(0, 5).map((item: any) => (
                <div key={item.name} className="flex items-center justify-between text-xs py-1.5 border-b border-slate-50 last:border-0 font-semibold">
                  <span className="text-slate-600 truncate max-w-[70%]">{item.name}</span>
                  <span className="font-extrabold text-indigo-600">{item.value} klik</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
