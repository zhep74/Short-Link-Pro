import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/src/db/index';
import { links, clicks } from '@/src/db/schema';
import { eq, and, desc, gte } from 'drizzle-orm';
import { verifyAuth } from '@/lib/api-auth';

export const dynamic = 'force-dynamic';

interface RouteParams {
  params: Promise<{ id: string }>;
}

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

    // Lookup link
    const linkRecords = await db.select().from(links).where(eq(links.id, linkId)).limit(1);
    if (linkRecords.length === 0) {
      return NextResponse.json({ error: 'Tautan tidak ditemukan' }, { status: 404 });
    }

    const link = linkRecords[0];

    // Ownership check: must be owner OR admin
    if (link.userId !== user.id && user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Fetch click logs
    const clickLogs = await db
      .select()
      .from(clicks)
      .where(eq(clicks.linkId, linkId))
      .orderBy(desc(clicks.createdAt));

    const totalClicks = clickLogs.length;

    // Time-based filtering (last 24 hours, 7 days, 30 days)
    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const clicksToday = clickLogs.filter((c) => new Date(c.createdAt) >= oneDayAgo).length;
    const clicksLast7Days = clickLogs.filter((c) => new Date(c.createdAt) >= sevenDaysAgo).length;
    const clicksLast30Days = clickLogs.filter((c) => new Date(c.createdAt) >= thirtyDaysAgo).length;

    // Grouping helper
    const groupBy = (array: any[], key: string) => {
      const counts: Record<string, number> = {};
      array.forEach((item) => {
        const val = item[key] || 'Unknown';
        counts[val] = (counts[val] || 0) + 1;
      });
      return Object.entries(counts).map(([name, value]) => ({ name, value }));
    };

    const countries = groupBy(clickLogs, 'country');
    const devices = groupBy(clickLogs, 'device');
    const browsers = groupBy(clickLogs, 'browser');
    const os = groupBy(clickLogs, 'os');
    const referrers = groupBy(clickLogs, 'referrer');

    // Clicks over time (grouped by date of last 7 days)
    const timeSeriesData: Record<string, number> = {};
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const dateString = d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
      timeSeriesData[dateString] = 0;
    }

    clickLogs.forEach((c) => {
      const clickDate = new Date(c.createdAt);
      // Ensure date is in the same timezone formatting
      const dateString = clickDate.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
      if (timeSeriesData[dateString] !== undefined) {
        timeSeriesData[dateString]++;
      }
    });

    const timeline = Object.entries(timeSeriesData).map(([date, clicks]) => ({
      date,
      clicks,
    }));

    return NextResponse.json({
      link,
      summary: {
        totalClicks,
        clicksToday,
        clicksLast7Days,
        clicksLast30Days,
        createdAt: link.createdAt,
        lastClickedAt: clickLogs.length > 0 ? clickLogs[0].createdAt : null,
      },
      charts: {
        timeline,
        countries,
        devices,
        browsers,
        os,
        referrers,
      },
    });
  } catch (error) {
    console.error('Failed to get link stats:', error);
    return NextResponse.json({ error: 'Gagal memuat statistik tautan' }, { status: 500 });
  }
}
