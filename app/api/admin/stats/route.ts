import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/src/db/index';
import { users, links, clicks, reports, blacklistDomains } from '@/src/db/schema';
import { eq, desc, sql } from 'drizzle-orm';
import { verifyAuth } from '@/lib/api-auth';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const user = await verifyAuth(req);
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden: Hanya untuk administrator' }, { status: 403 });
    }

    // 1. Fetch system totals
    const userCountResult = await db.select({ count: sql<number>`count(*)::int` }).from(users);
    const linkCountResult = await db.select({ count: sql<number>`count(*)::int` }).from(links);
    const clickCountResult = await db.select({ count: sql<number>`sum(click_count)::int` }).from(links);

    const totalUsers = userCountResult[0]?.count || 0;
    const totalLinks = linkCountResult[0]?.count || 0;
    const totalClicks = clickCountResult[0]?.count || 0;

    // 2. Fetch all links (joined with user info if available)
    const allLinks = await db
      .select({
        id: links.id,
        shortCode: links.shortCode,
        originalUrl: links.originalUrl,
        customAlias: links.customAlias,
        clickCount: links.clickCount,
        expiresAt: links.expiresAt,
        isActive: links.isActive,
        createdAt: links.createdAt,
        userEmail: users.email,
        userName: users.name,
      })
      .from(links)
      .leftJoin(users, eq(links.userId, users.id))
      .orderBy(desc(links.createdAt));

    // 3. Fetch all reports
    const allReports = await db
      .select({
        id: reports.id,
        reason: reports.reason,
        description: reports.description,
        status: reports.status,
        createdAt: reports.createdAt,
        linkId: links.id,
        shortCode: links.shortCode,
        originalUrl: links.originalUrl,
      })
      .from(reports)
      .innerJoin(links, eq(reports.linkId, links.id))
      .orderBy(desc(reports.createdAt));

    // 4. Fetch all blacklisted domains
    const blacklist = await db
      .select()
      .from(blacklistDomains)
      .orderBy(desc(blacklistDomains.createdAt));

    // 5. Fetch all users list
    const allUsers = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        role: users.role,
        createdAt: users.createdAt,
      })
      .from(users)
      .orderBy(desc(users.createdAt));

    return NextResponse.json({
      stats: {
        totalUsers,
        totalLinks,
        totalClicks,
      },
      links: allLinks,
      reports: allReports,
      blacklist,
      users: allUsers,
    });
  } catch (error) {
    console.error('Failed to load admin stats:', error);
    return NextResponse.json({ error: 'Gagal memuat statistik admin' }, { status: 500 });
  }
}
