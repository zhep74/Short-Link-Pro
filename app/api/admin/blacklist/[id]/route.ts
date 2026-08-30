import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/src/db/index';
import { blacklistDomains } from '@/src/db/schema';
import { eq } from 'drizzle-orm';
import { verifyAuth } from '@/lib/api-auth';

export const dynamic = 'force-dynamic';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function DELETE(req: NextRequest, { params }: RouteParams) {
  try {
    const user = await verifyAuth(req);
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await params;
    const blacklistId = parseInt(id);
    if (isNaN(blacklistId)) {
      return NextResponse.json({ error: 'ID tidak valid' }, { status: 400 });
    }

    await db.delete(blacklistDomains).where(eq(blacklistDomains.id, blacklistId));
    return NextResponse.json({ success: true, message: 'Domain berhasil dihapus dari daftar hitam' });
  } catch (error) {
    console.error('Failed to remove from blacklist:', error);
    return NextResponse.json({ error: 'Gagal menghapus domain dari daftar hitam' }, { status: 500 });
  }
}
