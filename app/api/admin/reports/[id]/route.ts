import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/src/db/index';
import { reports } from '@/src/db/schema';
import { eq } from 'drizzle-orm';
import { verifyAuth } from '@/lib/api-auth';

export const dynamic = 'force-dynamic';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function PUT(req: NextRequest, { params }: RouteParams) {
  try {
    const user = await verifyAuth(req);
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await params;
    const reportId = parseInt(id);
    if (isNaN(reportId)) {
      return NextResponse.json({ error: 'ID tidak valid' }, { status: 400 });
    }

    const body = await req.json();
    const { status } = body;

    const allowedStatus = ['pending', 'resolved', 'ignored'];
    if (!status || !allowedStatus.includes(status)) {
      return NextResponse.json({ error: 'Status tidak valid' }, { status: 400 });
    }

    const updated = await db
      .update(reports)
      .set({
        status,
        updatedAt: new Date(),
      })
      .where(eq(reports.id, reportId))
      .returning();

    return NextResponse.json(updated[0]);
  } catch (error) {
    console.error('Failed to update report status:', error);
    return NextResponse.json({ error: 'Gagal memperbarui status laporan' }, { status: 500 });
  }
}
