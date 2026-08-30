'use client';

import { useAuth } from '@/lib/auth-context';
import { User, Mail, Shield, ShieldCheck } from 'lucide-react';

export default function DashboardSettings() {
  const { user, dbUser } = useAuth();

  return (
    <div className="space-y-6 font-sans text-slate-900" id="dashboard-settings-view">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Pengaturan</h1>
        <p className="text-slate-500 text-sm mt-1">Lihat detail informasi akun Pintas Link Anda.</p>
      </div>

      {/* Profile Detail Card */}
      <div className="bg-white border border-slate-200 rounded-3xl shadow-sm p-6 max-w-xl space-y-6">
        <div className="flex items-center gap-4 border-b border-slate-100 pb-5">
          <div className="w-16 h-16 bg-indigo-600 text-white rounded-2xl flex items-center justify-center font-extrabold text-2xl shadow-lg shadow-indigo-100">
            {user?.email?.charAt(0).toUpperCase() || 'U'}
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900 leading-none">{dbUser?.name || user?.email?.split('@')[0]}</h2>
            <p className="text-xs text-slate-400 mt-2">Sesi aktif tersinkronisasi dengan Firebase Auth</p>
          </div>
        </div>

        <div className="space-y-5">
          <div className="flex items-start gap-3">
            <User size={16} className="text-indigo-600 mt-0.5 flex-shrink-0" />
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Nama Lengkap</span>
              <span className="text-xs font-bold text-slate-700 mt-1 block">{dbUser?.name || 'Belum diatur'}</span>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Mail size={16} className="text-indigo-600 mt-0.5 flex-shrink-0" />
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Alamat Email</span>
              <span className="text-xs font-bold text-slate-700 mt-1 block">{user?.email || 'N/A'}</span>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Shield size={16} className="text-indigo-600 mt-0.5 flex-shrink-0" />
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Hak Akses / Peran</span>
              <div className="flex items-center gap-1.5 mt-1.5">
                <span className={`px-2.5 py-1 border rounded-lg text-[10px] font-bold uppercase tracking-widest flex items-center gap-1 ${
                  dbUser?.role === 'admin' 
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                    : 'bg-indigo-50/50 text-indigo-700 border-indigo-100'
                }`}>
                  {dbUser?.role === 'admin' ? <ShieldCheck size={12} /> : null}
                  <span>{dbUser?.role || 'User'}</span>
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
