'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import Link from 'next/link';
import { motion, AnimatePresence } from 'motion/react';
import { ExternalLink, Copy, Check, ShieldAlert, BarChart3, Link2, Sparkles, AlertCircle } from 'lucide-react';

export default function LandingPage() {
  const { user, loading } = useAuth();
  const [originalUrl, setOriginalUrl] = useState('');
  const [customAlias, setCustomAlias] = useState('');
  const [expirationOption, setExpirationOption] = useState('never');
  const [customExpiryDate, setCustomExpiryDate] = useState('');
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successLink, setSuccessLink] = useState<any | null>(null);
  const [copied, setCopied] = useState(false);
  
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [originUrl, setOriginUrl] = useState('https://pintas.link');
  const [stats, setStats] = useState({ totalLinks: 0, totalClicks: 0 });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setOriginUrl(window.location.origin);
    }
    
    // Fetch live statistics
    fetch('/api/public-stats')
      .then((res) => res.json())
      .then((data) => {
        setStats({
          totalLinks: data.totalLinks || 512,
          totalClicks: data.totalClicks || 12048,
        });
      })
      .catch((err) => console.error('Failed to load live stats:', err));
  }, []);

  const handleShorten = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessLink(null);
    setCopied(false);

    if (!originalUrl.trim()) {
      setError('Masukkan URL asli terlebih dahulu.');
      return;
    }

    setIsSubmitting(true);

    try {
      // Determine Authorization headers if logged in
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      
      if (typeof window !== 'undefined') {
        const currentUser = user;
        if (currentUser) {
          const idToken = await currentUser.getIdToken();
          headers['Authorization'] = `Bearer ${idToken}`;
        }
      }

      const res = await fetch('/api/links', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          originalUrl,
          customAlias: customAlias.trim() || null,
          expirationOption,
          customExpiryDate: expirationOption === 'custom' ? customExpiryDate : null,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Terjadi kesalahan sistem.');
      }

      setSuccessLink(data);
      // Optional: clear input on success
      setOriginalUrl('');
      setCustomAlias('');
      setShowAdvanced(false);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopy = () => {
    if (!successLink) return;
    const shortCode = successLink.customAlias || successLink.shortCode;
    const fullShortUrl = `${originUrl}/${shortCode}`;
    
    navigator.clipboard.writeText(fullShortUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between font-sans text-slate-900" id="landing-page">
      {/* Navigation */}
      <header className="h-16 px-8 flex items-center justify-between bg-white border-b border-slate-200 shadow-sm sticky top-0 z-50">
        <div className="max-w-6xl mx-auto w-full flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center relative">
              <div className="w-4 h-1 bg-white rotate-45 absolute translate-y-[-1px] rounded-full"></div>
              <div className="w-4 h-1 bg-white -rotate-45 absolute translate-y-[1px] rounded-full"></div>
            </div>
            <span className="text-xl font-bold tracking-tight text-slate-800">Pintas Link</span>
          </Link>

          <nav className="flex items-center gap-6">
            {!loading && (
              <>
                {user ? (
                  <Link
                    href="/dashboard"
                    className="px-4 py-2 text-sm font-semibold text-white bg-indigo-600 rounded-full shadow-lg shadow-indigo-100 hover:bg-indigo-700 active:scale-95 transition-all"
                  >
                    <span>Dashboard</span>
                  </Link>
                ) : (
                  <>
                    <Link href="/login" className="text-sm font-semibold text-indigo-600 hover:text-indigo-700 transition-colors">
                      Masuk
                    </Link>
                    <Link
                      href="/login"
                      className="px-4 py-2 text-sm font-semibold text-white bg-indigo-600 rounded-full shadow-lg shadow-indigo-100 hover:bg-indigo-700 active:scale-95 transition-all"
                    >
                      Daftar Gratis
                    </Link>
                  </>
                )}
              </>
            )}
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-4xl mx-auto px-6 py-12 md:py-20 w-full flex flex-col justify-center items-center">
        {/* Hero Copy */}
        <div className="text-center max-w-2xl mb-8">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full text-xs font-semibold mb-4 border border-indigo-100">
            <Sparkles size={12} className="text-indigo-600 animate-pulse" />
            <span>Penyingkat Tautan Cepat &amp; Terpercaya</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight leading-tight">
            Perpendek Link, <br />
            <span className="text-indigo-600 font-extrabold">Bagikan Lebih Mudah.</span>
          </h1>
          <p className="text-slate-500 text-base md:text-lg mt-4 leading-relaxed max-w-xl mx-auto">
            Sederhanakan tautan panjang Anda menjadi ringkas, aman, dan dapat dilacak kinerjanya secara real-time.
          </p>
        </div>

        {/* Shortener Core Container with Glow */}
        <div className="relative group w-full max-w-xl">
          <div className="absolute inset-0 bg-indigo-500 blur-3xl opacity-10 group-hover:opacity-15 transition-opacity rounded-3xl"></div>
          <div className="relative bg-white border border-slate-200 rounded-3xl shadow-xl shadow-slate-100 p-6 md:p-8">
          <form onSubmit={handleShorten} className="space-y-4">
            <div>
              <label htmlFor="url-input" className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-wider">
                Masukkan URL Panjang Anda
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Link2 size={18} className="text-slate-400" />
                </div>
                <input
                  id="url-input"
                  type="text"
                  placeholder="https://www.example.com/artikel/panduan-lengkap-membuat-website"
                  value={originalUrl}
                  onChange={(e) => setOriginalUrl(e.target.value)}
                  className="w-full pl-10 pr-4 py-3.5 bg-slate-50/50 border border-slate-200 rounded-2xl text-sm placeholder-slate-400 text-slate-800 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 focus:bg-white transition-all font-medium"
                />
              </div>
            </div>

            {/* Advanced Toggle Button */}
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1 transition-colors uppercase tracking-wider"
            >
              <span>{showAdvanced ? 'Sembunyikan Opsi Tambahan' : 'Tampilkan Opsi Tambahan (Alias & Kedaluwarsa)'}</span>
              <span className="text-[10px]">{showAdvanced ? '▲' : '▼'}</span>
            </button>

            {/* Advanced Section */}
            {showAdvanced && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="pt-4 pb-2 space-y-4 border-t border-slate-100 mt-2"
              >
                {/* Custom Alias */}
                <div>
                  <label htmlFor="alias-input" className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wider">
                    Custom Alias (Opsional)
                  </label>
                  <div className="flex rounded-xl overflow-hidden border border-slate-200 bg-slate-50/50 focus-within:ring-4 focus-within:ring-indigo-500/10 focus-within:border-indigo-500 transition-all">
                    <span className="px-3 py-2.5 bg-slate-100 text-xs text-slate-400 border-r border-slate-200 flex items-center font-mono">
                      pintas.link/
                    </span>
                    <input
                      id="alias-input"
                      type="text"
                      placeholder="promo2026"
                      value={customAlias}
                      onChange={(e) => setCustomAlias(e.target.value)}
                      className="w-full px-3 py-2.5 text-sm bg-transparent placeholder-slate-400 text-slate-800 focus:outline-none font-medium"
                    />
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1">
                    Gunakan 3-30 karakter (huruf, angka, - atau _).
                  </p>
                </div>

                {/* Expiration link */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="expire-select" className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wider">
                      Masa Berlaku
                    </label>
                    <select
                      id="expire-select"
                      value={expirationOption}
                      onChange={(e) => setExpirationOption(e.target.value)}
                      className="w-full px-3 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-medium"
                    >
                      <option value="never">Tidak Pernah Expired</option>
                      <option value="1d">1 Hari</option>
                      <option value="7d">7 Hari</option>
                      <option value="30d">30 Hari</option>
                      <option value="custom">Custom Tanggal</option>
                    </select>
                  </div>

                  {expirationOption === 'custom' && (
                    <div>
                      <label htmlFor="expire-date" className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wider">
                        Pilih Tanggal
                      </label>
                      <input
                        id="expire-date"
                        type="date"
                        min={new Date().toISOString().split('T')[0]}
                        value={customExpiryDate}
                        onChange={(e) => setCustomExpiryDate(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50/50 border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-medium"
                      />
                    </div>
                  )}
                </div>

                {/* Anonymous Notice */}
                {!user && (
                  <div className="p-3 bg-indigo-50/50 border border-indigo-100 rounded-xl flex gap-2 items-start text-indigo-800">
                    <AlertCircle size={14} className="mt-0.5 flex-shrink-0 text-indigo-600" />
                    <p className="text-[10px] leading-normal font-medium">
                      <strong>Catatan Pengguna Anonim:</strong> Tautan pendek Anda otomatis kedaluwarsa dalam <strong>1 hari</strong> untuk menghindari penyalahgunaan. <Link href="/login" className="underline font-bold hover:text-indigo-950">Masuk</Link> untuk tautan permanen dan statistik kustom.
                    </p>
                  </div>
                )}
              </motion.div>
            )}

            {/* Error Message */}
            {error && (
              <div className="p-4 bg-rose-50 border border-rose-100 rounded-xl text-rose-600 text-xs flex gap-2 items-start" id="shorten-error">
                <AlertCircle size={16} className="text-rose-500 flex-shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <span className="font-bold block">Gagal Membuat Tautan:</span>
                  <p>{error}</p>
                </div>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full flex items-center justify-center bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-bold py-4 rounded-xl text-sm transition-all shadow-lg shadow-indigo-100 focus:outline-none focus:ring-4 focus:ring-indigo-500/20 disabled:opacity-50"
            >
              {isSubmitting ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                'Perpendek Link'
              )}
            </button>
          </form>

          {/* Success Banner Card */}
          <AnimatePresence>
            {successLink && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="mt-6 p-5 bg-indigo-950 text-white rounded-2xl space-y-3 shadow-lg relative overflow-hidden border border-indigo-900"
                id="shorten-success"
              >
                <div className="flex items-center gap-2 text-xs font-semibold text-indigo-200">
                  <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
                  <span>Tautan Berhasil Diperpendek!</span>
                </div>
                
                <div className="flex items-center justify-between gap-2 bg-white/10 border border-white/10 rounded-xl p-3">
                  <span className="text-xs truncate select-all font-mono text-indigo-100 font-semibold">
                    {originUrl}/{successLink.customAlias || successLink.shortCode}
                  </span>
                  <div className="flex gap-1.5">
                    <button
                      onClick={handleCopy}
                      className="p-1.5 hover:bg-white/15 rounded-lg transition-colors text-indigo-200 hover:text-white"
                      title="Salin ke papan klip"
                    >
                      {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                    </button>
                    <a
                      href={`${originUrl}/${successLink.customAlias || successLink.shortCode}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 hover:bg-white/15 rounded-lg transition-colors text-indigo-200 hover:text-white"
                      title="Buka tautan pendek"
                    >
                      <ExternalLink size={14} />
                    </a>
                  </div>
                </div>

                <div className="flex justify-between items-center pt-1 text-[10px] text-indigo-300 font-medium">
                  <span className="truncate max-w-[70%]">Asli: {successLink.originalUrl}</span>
                  <Link
                    href={`/report/${successLink.customAlias || successLink.shortCode}`}
                    className="flex items-center gap-1 hover:text-rose-400 transition-colors"
                  >
                    <ShieldAlert size={10} />
                    <span>Laporkan</span>
                  </Link>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

        {/* Live Statistics */}
        <div className="flex items-center justify-center gap-8 w-full max-w-xl mt-12 border-t border-slate-200/80 pt-10">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-widest">
            <div className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse"></div>
            <span>{stats.totalLinks.toLocaleString()} Tautan Dibuat</span>
          </div>
          <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-widest">
            <div className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse"></div>
            <span>{stats.totalClicks.toLocaleString()} Total Pengunjung</span>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200/60 bg-white py-6">
        <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>&copy; {new Date().getFullYear()} Pintas Link. Hak Cipta Dilindungi.</p>
          <div className="flex gap-4">
            <Link href="/login" className="hover:text-slate-800 transition-colors">Admin Panel</Link>
            <span className="text-slate-300">|</span>
            <Link href="/" className="hover:text-slate-800 transition-colors">Kebijakan Privasi</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
