'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function LoginPage() {
  const { user, loginWithGoogle, loading } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [isSigningIn, setIsSigningIn] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (user && !loading) {
      router.push('/dashboard');
    }
  }, [user, loading, router]);

  const handleGoogleLogin = async () => {
    setIsSigningIn(true);
    setError(null);
    try {
      await loginWithGoogle();
      router.push('/dashboard');
    } catch (err: any) {
      console.error('Google Auth Error:', err);
      setError('Gagal masuk menggunakan Google. Silakan coba lagi.');
    } finally {
      setIsSigningIn(false);
    }
  };

  if (loading || (user && !isSigningIn)) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50 font-sans">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-600 text-sm font-semibold">Memuat profil...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 px-6 py-12 font-sans text-slate-900" id="login-page">
      <div className="max-w-md w-full bg-white rounded-3xl border border-slate-200 shadow-md p-8 md:p-10">
        {/* Logo and Brand */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-6">
            <div className="w-10 h-10 bg-indigo-600 text-white rounded-xl flex items-center justify-center font-extrabold text-lg shadow-lg shadow-indigo-100">PL</div>
            <span className="text-xl font-extrabold tracking-tight text-slate-900">Pintas Link</span>
          </Link>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Selamat Datang Kembali</h1>
          <p className="text-sm text-slate-500 mt-2">Masuk untuk mengelola dan memantau tautan pendek Anda.</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-rose-50 border border-rose-200 rounded-2xl text-rose-600 text-xs font-semibold flex gap-2 items-start">
            <span className="font-extrabold text-rose-800">Error:</span>
            <span>{error}</span>
          </div>
        )}

        {/* Action Button */}
        <div className="space-y-4">
          <button
            onClick={handleGoogleLogin}
            disabled={isSigningIn}
            className="w-full flex items-center justify-center gap-3 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 hover:text-slate-800 px-5 py-3.5 rounded-xl text-sm font-bold transition-all shadow-sm focus:outline-none focus:ring-4 focus:ring-indigo-100 disabled:opacity-50"
          >
            {isSigningIn ? (
              <div className="w-5 h-5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="#EA4335"
                  d="M12.24 10.285V14.4h6.887c-.275 1.565-1.88 4.604-6.887 4.604-4.33 0-7.86-3.577-7.86-8s3.53-8 7.86-8c2.46 0 4.105 1.025 5.047 1.926l3.227-3.106C18.23 2.016 15.42 1 12.24 1c-6.07 0-11 4.93-11 11s4.93 11 11 11c6.34 0 10.56-4.45 10.56-10.75 0-.72-.08-1.27-.18-1.78l-10.38-.185z"
                />
              </svg>
            )}
            <span>{isSigningIn ? 'Menghubungkan...' : 'Masuk dengan Google'}</span>
          </button>
        </div>

        <div className="mt-8 pt-6 border-t border-slate-100 text-center">
          <p className="text-[11px] font-medium text-slate-400 leading-relaxed">
            Dengan masuk, Anda menyetujui Ketentuan Layanan dan Kebijakan Privasi platform Pintas Link.
          </p>
        </div>
      </div>
    </div>
  );
}
