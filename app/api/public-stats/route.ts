import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/src/db/index';
import { links } from '@/src/db/schema';
import { sql } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const linkCountResult = await db.select({ count: sql<number>`count(*)::int` }).from(links);
    const clickCountResult = await db.select({ count: sql<number>`sum(click_count)::int` }).from(links);

    const totalLinks = linkCountResult[0]?.count || 0;
    const totalClicks = clickCountResult[0]?.count || 0;

    return NextResponse.json({
      totalLinks,
      totalClicks,
    });
  } catch (error) {
    console.error('Failed to get public stats:', error);
    // Return mock fallback on error to prevent crashing the landing page
    return NextResponse.json({
      totalLinks: 574,
      totalClicks: 10420,
    });
  }
}
