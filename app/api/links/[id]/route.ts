import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/src/db/index';
import { links } from '@/src/db/schema';
import { eq, and, or } from 'drizzle-orm';
import { verifyAuth } from '@/lib/api-auth';
import { isDomainBlacklisted } from '@/lib/blacklist';

export const dynamic = 'force-dynamic';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// 1. GET /api/links/[id] - Get details of a single link
export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const user = await verifyAuth(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const linkId = parseInt(id);
    if (isNaN(linkId)) {
      return NextResponse.json({ error: 'ID tidak valid' }, { status: 400 });
    }

    const linkRecords = await db.select().from(links).where(eq(links.id, linkId)).limit(1);
    if (linkRecords.length === 0) {
      return NextResponse.json({ error: 'Tautan tidak ditemukan' }, { status: 404 });
    }

    const link = linkRecords[0];

    // Check ownership: must be the owner OR an admin
    if (link.userId !== user.id && user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden: Anda tidak memiliki akses ke tautan ini' }, { status: 403 });
    }

    return NextResponse.json(link);
  } catch (error) {
    console.error('Failed to get link:', error);
    return NextResponse.json({ error: 'Gagal mengambil detail tautan' }, { status: 500 });
  }
}

// 2. PUT /api/links/[id] - Update a short link (originalUrl, customAlias, expiresAt, isActive)
export async function PUT(req: NextRequest, { params }: RouteParams) {
  try {
    const user = await verifyAuth(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const linkId = parseInt(id);
    if (isNaN(linkId)) {
      return NextResponse.json({ error: 'ID tidak valid' }, { status: 400 });
    }

    // Lookup link
    const linkRecords = await db.select().from(links).where(eq(links.id, linkId)).limit(1);
    if (linkRecords.length === 0) {
      return NextResponse.json({ error: 'Tautan tidak ditemukan' }, { status: 404 });
    }

    const link = linkRecords[0];

    // Ownership check: must be owner OR admin
    if (link.userId !== user.id && user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden: Anda tidak diizinkan mengubah tautan ini' }, { status: 403 });
    }

    const body = await req.json();
    const { originalUrl, customAlias, isActive, expirationOption, customExpiryDate } = body;

    const updateFields: Partial<typeof links.$inferSelect> = {
      updatedAt: new Date(),
    };

    // Original URL update and validation
    if (originalUrl !== undefined) {
      let cleanUrl = originalUrl.trim();
      if (cleanUrl === '') {
        return NextResponse.json({ error: 'URL asli tidak boleh kosong' }, { status: 400 });
      }

      if (!/^https?:\/\//i.test(cleanUrl)) {
        cleanUrl = 'https://' + cleanUrl;
      }

      try {
        new URL(cleanUrl);
      } catch {
        return NextResponse.json({ error: 'URL asli tidak valid' }, { status: 400 });
      }

      const isBlacklisted = await isDomainBlacklisted(cleanUrl);
      if (isBlacklisted) {
        return NextResponse.json({ error: 'Situs ini diblokir oleh administrator karena terindikasi berbahaya' }, { status: 400 });
      }

      updateFields.originalUrl = cleanUrl;
    }

    // Custom Alias update and validation
    if (customAlias !== undefined) {
      if (customAlias === null || customAlias.trim() === '') {
        updateFields.customAlias = null;
      } else {
        const cleanAlias = customAlias.trim().toLowerCase();

        if (!/^[a-z0-9-_]+$/i.test(cleanAlias)) {
          return NextResponse.json({ error: 'Alias hanya boleh huruf, angka, -, dan _' }, { status: 400 });
        }

        if (cleanAlias.length < 3 || cleanAlias.length > 30) {
          return NextResponse.json({ error: 'Alias harus terdiri dari 3 hingga 30 karakter' }, { status: 400 });
        }

        const reservedWords = ['admin', 'login', 'register', 'dashboard', 'api', 'settings', 'report', 'expired', '404'];
        if (reservedWords.includes(cleanAlias)) {
          return NextResponse.json({ error: 'Alias merupakan kata cadangan sistem' }, { status: 400 });
        }

        // Check uniqueness but exclude the current link itself
        const existing = await db
          .select()
          .from(links)
          .where(and(or(eq(links.shortCode, cleanAlias), eq(links.customAlias, cleanAlias)), eq(links.id, linkId)))
          .limit(1);

        // If it's used by ANOTHER link, then fail
        const otherExisting = await db
          .select()
          .from(links)
          .where(and(or(eq(links.shortCode, cleanAlias), eq(links.customAlias, cleanAlias)), eq(links.id, linkId))); // Let's check generally:
        const duplicateCheck = await db
          .select()
          .from(links)
          .where(or(eq(links.shortCode, cleanAlias), eq(links.customAlias, cleanAlias)))
          .limit(2);

        const existsOnOther = duplicateCheck.some((l) => l.id !== linkId);
        if (existsOnOther) {
          return NextResponse.json({ error: 'Alias sudah digunakan oleh tautan lain' }, { status: 400 });
        }

        updateFields.customAlias = cleanAlias;
      }
    }

    // IsActive update
    if (isActive !== undefined) {
      updateFields.isActive = !!isActive;
    }

    // Expiration Option update
    if (expirationOption !== undefined) {
      const now = new Date();
      if (expirationOption === 'never' || expirationOption === null) {
        updateFields.expiresAt = null;
      } else if (expirationOption === '1d') {
        updateFields.expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000);
      } else if (expirationOption === '7d') {
        updateFields.expiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      } else if (expirationOption === '30d') {
        updateFields.expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
      } else if (expirationOption === 'custom' && customExpiryDate) {
        const customDate = new Date(customExpiryDate);
        if (isNaN(customDate.getTime()) || customDate < now) {
          return NextResponse.json({ error: 'Tanggal kedaluwarsa harus valid dan berada di masa depan' }, { status: 400 });
        }
        updateFields.expiresAt = customDate;
      }
    }

    const updated = await db.update(links).set(updateFields).where(eq(links.id, linkId)).returning();
    return NextResponse.json(updated[0]);
  } catch (error) {
    console.error('Failed to update link:', error);
    return NextResponse.json({ error: 'Gagal memperbarui tautan' }, { status: 500 });
  }
}

// 3. DELETE /api/links/[id] - Delete a short link
export async function DELETE(req: NextRequest, { params }: RouteParams) {
  try {
    const user = await verifyAuth(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const linkId = parseInt(id);
    if (isNaN(linkId)) {
      return NextResponse.json({ error: 'ID tidak valid' }, { status: 400 });
    }

    // Lookup link
    const linkRecords = await db.select().from(links).where(eq(links.id, linkId)).limit(1);
    if (linkRecords.length === 0) {
      return NextResponse.json({ error: 'Tautan tidak ditemukan' }, { status: 404 });
    }

    const link = linkRecords[0];

    // Ownership check: must be owner OR admin
    if (link.userId !== user.id && user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden: Anda tidak diizinkan menghapus tautan ini' }, { status: 403 });
    }

    await db.delete(links).where(eq(links.id, linkId));
    return NextResponse.json({ success: true, message: 'Tautan berhasil dihapus' });
  } catch (error) {
    console.error('Failed to delete link:', error);
    return NextResponse.json({ error: 'Gagal menghapus tautan' }, { status: 500 });
  }
}
