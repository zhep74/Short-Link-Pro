import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/src/db/index';
import { links, reports } from '@/src/db/schema';
import { eq, or } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { shortCode, reason, description } = body;

    if (!shortCode || typeof shortCode !== 'string') {
      return NextResponse.json({ error: 'Kode tautan pendek wajib diisi' }, { status: 400 });
    }

    if (!reason || typeof reason !== 'string') {
      return NextResponse.json({ error: 'Alasan pelaporan wajib dipilih' }, { status: 400 });
    }

    if (!description || typeof description !== 'string' || description.trim() === '') {
      return NextResponse.json({ error: 'Deskripsi detail laporan wajib diisi' }, { status: 400 });
    }

    const allowedReasons = ['Phishing', 'Malware', 'Spam', 'Scam', 'Konten ilegal'];
    if (!allowedReasons.includes(reason)) {
      return NextResponse.json({ error: 'Alasan pelaporan tidak valid' }, { status: 400 });
    }

    // Lookup link
    const linkRecords = await db
      .select()
      .from(links)
      .where(or(eq(links.shortCode, shortCode), eq(links.customAlias, shortCode)))
      .limit(1);

    if (linkRecords.length === 0) {
      return NextResponse.json({ error: 'Tautan yang dilaporkan tidak ditemukan' }, { status: 404 });
    }

    const link = linkRecords[0];

    // Create report
    const inserted = await db
      .insert(reports)
      .values({
        linkId: link.id,
        reason,
        description: description.trim(),
        status: 'pending',
      })
      .returning();

    return NextResponse.json({
      success: true,
      message: 'Laporan Anda telah berhasil dikirim. Terima kasih telah menjaga keamanan platform kami.',
      report: inserted[0],
    }, { status: 201 });
  } catch (error) {
    console.error('Failed to create report:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan sistem saat mengirim laporan' }, { status: 500 });
  }
}
