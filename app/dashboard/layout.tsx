'use client';

import { useAuth } from '@/lib/auth-context';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { LayoutDashboard, Link2, Settings, ShieldCheck, LogOut, Menu, X, User } from 'lucide-react';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, dbUser, loading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  const handleLogout = async () => {
    await logout();
    router.push('/');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-600 text-sm font-semibold">Menyelaraskan sesi...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const navItems = [
    { name: 'Ringkasan', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Tautan Saya', href: '/dashboard/links', icon: Link2 },
    { name: 'Pengaturan', href: '/dashboard/settings', icon: Settings },
  ];

  const isAdmin = dbUser?.role === 'admin';

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row font-sans text-slate-900" id="dashboard-shell">
      {/* Mobile Top Bar */}
      <header className="md:hidden h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between sticky top-0 z-50 shadow-sm">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center relative">
            <div className="w-4 h-1 bg-white rotate-45 absolute translate-y-[-1px] rounded-full"></div>
            <div className="w-4 h-1 bg-white -rotate-45 absolute translate-y-[1px] rounded-full"></div>
          </div>
          <span className="text-base font-bold tracking-tight text-slate-800">Pintas Link</span>
        </Link>
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-600 hover:text-indigo-600 transition-colors"
        >
          {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </header>

      {/* Sidebar Navigation */}
      <aside
        className={`fixed md:sticky top-0 left-0 h-[calc(100vh-4rem)] md:h-screen w-64 bg-white border-r border-slate-200 p-6 flex flex-col justify-between transition-transform duration-200 z-40 md:translate-x-0 shadow-sm ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:block'
        }`}
      >
        <div className="space-y-8">
          {/* Logo */}
          <Link href="/" className="hidden md:flex items-center gap-2">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center relative">
              <div className="w-4 h-1 bg-white rotate-45 absolute translate-y-[-1px] rounded-full"></div>
              <div className="w-4 h-1 bg-white -rotate-45 absolute translate-y-[1px] rounded-full"></div>
            </div>
            <span className="text-lg font-bold tracking-tight text-slate-800">Pintas Link</span>
          </Link>

          {/* User Info Card */}
          <div className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-100 rounded-2xl">
            <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center font-bold text-sm">
              <User size={18} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-slate-800 truncate">{dbUser?.name || user.email?.split('@')[0]}</p>
              <p className="text-[10px] text-slate-400 truncate">{user.email}</p>
            </div>
          </div>

          {/* Nav Items Group */}
          <nav className="space-y-1.5">
            <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 px-3">Menu Utama</span>
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all ${
                    isActive
                      ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100'
                      : 'text-slate-500 hover:text-indigo-600 hover:bg-indigo-50/40'
                  }`}
                >
                  <Icon size={16} />
                  <span>{item.name}</span>
                </Link>
              );
            })}

            {/* Admin navigation if applicable */}
            {isAdmin && (
              <div className="pt-4 border-t border-slate-100 mt-4 space-y-1.5">
                <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 px-3">Sistem</span>
                <Link
                  href="/admin"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all ${
                    pathname.startsWith('/admin')
                      ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-100'
                      : 'text-slate-500 hover:text-emerald-600 hover:bg-emerald-50/40'
                  }`}
                >
                  <ShieldCheck size={16} />
                  <span>Admin Panel</span>
                </Link>
              </div>
            )}
          </nav>
        </div>

        {/* Footer actions inside Sidebar */}
        <div className="space-y-3 pt-6 border-t border-slate-100">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-50 transition-all text-left"
          >
            <LogOut size={16} />
            <span>Keluar Akun</span>
          </button>
        </div>
      </aside>

      {/* Main Content Pane */}
      <main className="flex-1 min-w-0 p-6 md:p-10">{children}</main>
    </div>
  );
}
