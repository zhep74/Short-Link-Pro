import Link from 'next/link';

export const dynamic = 'force-static';

export default function LinkExpiredPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 px-6 py-12 text-center" id="expired-page">
      <div className="max-w-md w-full bg-white rounded-2xl border border-slate-100 shadow-sm p-8 md:p-12">
        <div className="w-16 h-16 bg-amber-50 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
          </svg>
        </div>
        <h1 className="text-3xl font-semibold text-slate-900 tracking-tight mb-3">Link Sudah Kedaluwarsa</h1>
        <p className="text-slate-600 text-base mb-8 leading-relaxed">
          Tautan pendek ini telah mencapai batas waktu kedaluwarsa yang diatur oleh pemiliknya dan tidak lagi dapat diakses.
        </p>
        <Link
          href="/"
          className="inline-flex w-full items-center justify-center rounded-xl bg-slate-900 px-5 py-3 text-sm font-medium text-white hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-950 focus:ring-offset-2 transition-colors duration-150"
        >
          Kembali ke Beranda
        </Link>
      </div>
    </div>
  );
}
