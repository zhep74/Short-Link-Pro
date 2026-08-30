import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/src/db/index';
import { links } from '@/src/db/schema';
import { eq, and, desc, or } from 'drizzle-orm';
import { verifyAuth } from '@/lib/api-auth';
import { isDomainBlacklisted } from '@/lib/blacklist';
import { rateLimit } from '@/lib/rate-limit';

export const dynamic = 'force-dynamic';

function generateShortCode(length: number = 7): string {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// 1. GET /api/links - Fetch links for the authenticated user
export async function GET(req: NextRequest) {
  try {
    const user = await verifyAuth(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized: Harap masuk terlebih dahulu' }, { status: 401 });
    }

    const userLinks = await db
      .select()
      .from(links)
      .where(eq(links.userId, user.id))
      .orderBy(desc(links.createdAt));

    return NextResponse.json(userLinks);
  } catch (error) {
    console.error('Failed to fetch user links:', error);
    return NextResponse.json({ error: 'Gagal mengambil data tautan' }, { status: 500 });
  }
}

// 2. POST /api/links - Create a short link
export async function POST(req: NextRequest) {
  try {
    // Determine user session
    const user = await verifyAuth(req);

    // Rate Limiting
    const ip = req.headers.get('x-forwarded-for') || (req as any).ip || 'anonymous-ip';
    // Authenticated users get 60 links per minute, anonymous gets 5 links per minute
    const limit = user ? 60 : 5;
    const windowMs = 60 * 1000; // 1 minute
    const limiter = rateLimit(ip, limit, windowMs);

    if (!limiter.success) {
      return NextResponse.json(
        { error: 'Batas pembuatan tautan terlampaui. Silakan coba lagi nanti.' },
        { status: 429 }
      );
    }

    const body = await req.json();
    const { originalUrl, customAlias, expirationOption, customExpiryDate } = body;

    // Validation: URL must not be empty
    if (!originalUrl || typeof originalUrl !== 'string' || originalUrl.trim() === '') {
      return NextResponse.json({ error: 'URL asli tidak boleh kosong' }, { status: 400 });
    }

    // Validation: Must be valid HTTP/HTTPS URL
    let cleanUrl = originalUrl.trim();
    if (!/^https?:\/\//i.test(cleanUrl)) {
      cleanUrl = 'https://' + cleanUrl;
    }

    try {
      new URL(cleanUrl);
    } catch {
      return NextResponse.json({ error: 'URL asli tidak valid. Gunakan format yang benar (misalnya: https://example.com)' }, { status: 400 });
    }

    // Validation: Blacklist Domain Check
    const isBlacklisted = await isDomainBlacklisted(cleanUrl);
    if (isBlacklisted) {
      return NextResponse.json(
        { error: 'Situs ini diblokir oleh administrator karena terindikasi berbahaya (phishing/malware).' },
        { status: 400 }
      );
    }

    // Validation: Custom Alias
    let cleanAlias: string | null = null;
    if (customAlias && typeof customAlias === 'string' && customAlias.trim() !== '') {
      cleanAlias = customAlias.trim().toLowerCase();

      // Check format
      if (!/^[a-z0-9-_]+$/i.test(cleanAlias)) {
        return NextResponse.json(
          { error: 'Custom alias hanya boleh terdiri dari huruf, angka, tanda hubung (-), dan garis bawah (_)' },
          { status: 400 }
        );
      }

      // Check length
      if (cleanAlias.length < 3 || cleanAlias.length > 30) {
        return NextResponse.json({ error: 'Custom alias harus terdiri dari 3 hingga 30 karakter' }, { status: 400 });
      }

      // Check reserved words
      const reservedWords = ['admin', 'login', 'register', 'dashboard', 'api', 'settings', 'report', 'expired', '404'];
      if (reservedWords.includes(cleanAlias)) {
        return NextResponse.json({ error: 'Alias ini merupakan kata kunci cadangan sistem dan tidak dapat digunakan' }, { status: 400 });
      }

      // Check if alias is already taken (either in shortCode or customAlias column)
      const existing = await db
        .select()
        .from(links)
        .where(or(eq(links.shortCode, cleanAlias), eq(links.customAlias, cleanAlias)))
        .limit(1);

      if (existing.length > 0) {
        return NextResponse.json({ error: 'Alias ini sudah digunakan oleh tautan lain. Silakan pilih alias lain.' }, { status: 400 });
      }
    }

    // Expiration handling
    let expiresAt: Date | null = null;
    if (expirationOption) {
      const now = new Date();
      if (expirationOption === '1d') {
        expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000);
      } else if (expirationOption === '7d') {
        expiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      } else if (expirationOption === '30d') {
        expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
      } else if (expirationOption === 'custom' && customExpiryDate) {
        const customDate = new Date(customExpiryDate);
        if (isNaN(customDate.getTime()) || customDate < now) {
          return NextResponse.json({ error: 'Tanggal kedaluwarsa harus valid dan berada di masa depan' }, { status: 400 });
        }
        expiresAt = customDate;
      }
    }

    // Enforce limits on anonymous link usage
    if (!user) {
      // For anonymous users, always force a max expiration of 1 day to prevent database bloating/abuse
      const oneDayExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);
      if (!expiresAt || expiresAt > oneDayExpiry) {
        expiresAt = oneDayExpiry;
      }
    }

    // Generate unique short code
    let shortCode = '';
    let isUnique = false;
    let attempts = 0;

    while (!isUnique && attempts < 10) {
      shortCode = generateShortCode(7);
      attempts++;

      // Make sure shortCode doesn't collide with any existing shortCode or customAlias
      const existing = await db
        .select()
        .from(links)
        .where(or(eq(links.shortCode, shortCode), eq(links.customAlias, shortCode)))
        .limit(1);

      if (existing.length === 0) {
        isUnique = true;
      }
    }

    if (!isUnique) {
      return NextResponse.json({ error: 'Gagal menghasilkan kode unik, silakan coba lagi' }, { status: 500 });
    }

    // Insert into DB
    const inserted = await db
      .insert(links)
      .values({
        userId: user ? user.id : null,
        shortCode,
        originalUrl: cleanUrl,
        customAlias: cleanAlias,
        expiresAt,
        clickCount: 0,
        isActive: true,
      })
      .returning();

    const createdLink = inserted[0];

    return NextResponse.json(createdLink, { status: 201 });
  } catch (error) {
    console.error('Failed to create short link:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan internal server' }, { status: 500 });
  }
}
