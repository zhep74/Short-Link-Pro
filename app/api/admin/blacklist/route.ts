import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/src/db/index';
import { blacklistDomains } from '@/src/db/schema';
import { eq, desc } from 'drizzle-orm';
import { verifyAuth } from '@/lib/api-auth';
import { extractDomain } from '@/lib/blacklist';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const user = await verifyAuth(req);
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();
    const { domain, reason } = body;

    if (!domain || typeof domain !== 'string') {
      return NextResponse.json({ error: 'Nama domain wajib diisi' }, { status: 400 });
    }

    const cleanDomain = extractDomain(domain);
    if (!cleanDomain) {
      return NextResponse.json({ error: 'Format domain tidak valid' }, { status: 400 });
    }

    // Check if already blacklisted
    const existing = await db
      .select()
      .from(blacklistDomains)
      .where(eq(blacklistDomains.domain, cleanDomain))
      .limit(1);

    if (existing.length > 0) {
      return NextResponse.json({ error: 'Domain ini sudah masuk daftar hitam' }, { status: 400 });
    }

    const inserted = await db
      .insert(blacklistDomains)
      .values({
        domain: cleanDomain,
        reason: reason || 'Banned by administrator',
      })
      .returning();

    return NextResponse.json(inserted[0], { status: 201 });
  } catch (error) {
    console.error('Failed to blacklist domain:', error);
    return NextResponse.json({ error: 'Gagal memasukkan domain ke daftar hitam' }, { status: 500 });
  }
}
