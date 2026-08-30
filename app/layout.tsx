import type {Metadata} from 'next';
import './globals.css'; // Global styles
import { AuthProvider } from '@/lib/auth-context';

export const metadata: Metadata = {
  title: 'Pintas Link - Perpendek Tautan Anda',
  description: 'Platform penyingkat URL modern, cepat, aman, dan responsif.',
  openGraph: {
    title: 'Pintas Link - Perpendek Tautan Anda',
    description: 'Platform penyingkat URL modern, cepat, aman, dan responsif.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Pintas Link - Perpendek Tautan Anda',
    description: 'Platform penyingkat URL modern, cepat, aman, dan responsif.',
  },
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="id" suppressHydrationWarning>
      <body suppressHydrationWarning className="bg-slate-50 text-slate-900 antialiased font-sans">
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
