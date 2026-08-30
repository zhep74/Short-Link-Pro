import { notFound, redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { db } from '@/src/db/index';
import { links, clicks } from '@/src/db/schema';
import { eq, or } from 'drizzle-orm';
import { parseUserAgent } from '@/lib/ua-parser';

interface PageProps {
  params: Promise<{ shortCode: string }>;
}

export const dynamic = 'force-dynamic';

export default async function RedirectPage({ params }: PageProps) {
  const { shortCode } = await params;

  // Reserved words check
  const reservedWords = ['admin', 'login', 'register', 'dashboard', 'api', 'settings', 'report', 'expired', '404'];
  if (reservedWords.includes(shortCode.toLowerCase())) {
    return notFound();
  }

  // 1. Find link by shortCode or customAlias
  let linkRecord;
  try {
    const results = await db
      .select()
      .from(links)
      .where(or(eq(links.shortCode, shortCode), eq(links.customAlias, shortCode)))
      .limit(1);

    if (results.length > 0) {
      linkRecord = results[0];
    }
  } catch (error) {
    console.error('Failed to lookup shortlink:', error);
    // Generic database error handling
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 p-6 text-center" id="db-error">
        <h1 className="text-2xl font-bold text-slate-800 mb-2">Terjadi Kesalahan Sistem</h1>
        <p className="text-slate-600 max-w-md">Tidak dapat memproses pengalihan tautan saat ini. Silakan coba beberapa saat lagi.</p>
      </div>
    );
  }

  if (!linkRecord) {
    redirect('/404');
  }

  // 2. Check active status
  if (!linkRecord.isActive) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 p-6 text-center" id="inactive-link">
        <div className="w-16 h-16 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mb-4 text-2xl font-bold">!</div>
        <h1 className="text-2xl font-bold text-slate-800 mb-2">Tautan Tidak Aktif</h1>
        <p className="text-slate-600 max-w-md">Tautan ini telah dinonaktifkan oleh pemilik atau administrator sistem.</p>
        <a href="/" className="mt-6 px-4 py-2 bg-slate-900 text-white rounded-md text-sm hover:bg-slate-800 transition-colors">
          Kembali ke Beranda
        </a>
      </div>
    );
  }

  // 3. Check expiration
  if (linkRecord.expiresAt && new Date(linkRecord.expiresAt) < new Date()) {
    redirect('/expired');
  }

  // 4. Record Click asynchronously (to keep redirection super fast)
  try {
    const headerList = await headers();
    const userAgent = headerList.get('user-agent');
    const acceptLanguage = headerList.get('accept-language');
    const referrer = headerList.get('referer') || 'Direct';

    const parsedUA = parseUserAgent(userAgent, acceptLanguage);

    // Update click count on Link
    await db
      .update(links)
      .set({
        clickCount: linkRecord.clickCount + 1,
        updatedAt: new Date(),
      })
      .where(eq(links.id, linkRecord.id));

    // Insert Click log record
    await db.insert(clicks).values({
      linkId: linkRecord.id,
      country: parsedUA.country,
      device: parsedUA.device,
      browser: parsedUA.browser,
      os: parsedUA.os,
      referrer: referrer.startsWith('http') ? new URL(referrer).hostname : referrer,
    });
  } catch (clickErr) {
    // Fail silently on click tracking to ensure user still gets redirected
    console.error('Failed to log click details:', clickErr);
  }

  // 5. Redirect to original URL
  let targetUrl = linkRecord.originalUrl;
  if (!targetUrl.startsWith('http://') && !targetUrl.startsWith('https://')) {
    targetUrl = 'https://' + targetUrl;
  }

  redirect(targetUrl);
}
