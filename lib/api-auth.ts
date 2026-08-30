import { adminAuth } from '@/lib/firebase-admin';
import { db } from '@/src/db/index';
import { users } from '@/src/db/schema';
import { eq } from 'drizzle-orm';

export interface AuthenticatedUser {
  id: number;
  uid: string;
  name: string | null;
  email: string;
  role: string;
  createdAt: Date;
  updatedAt: Date;
}

export async function verifyAuth(req: Request): Promise<AuthenticatedUser | null> {
  const authHeader = req.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.split('Bearer ')[1];
  try {
    const decodedToken = await adminAuth.verifyIdToken(token);
    if (!decodedToken.uid || !decodedToken.email) {
      return null;
    }

    const email = decodedToken.email;
    const uid = decodedToken.uid;
    const name = (decodedToken.name as string) || email.split('@')[0];

    // Robust Upsert check
    const existingUsers = await db.select().from(users).where(eq(users.uid, uid)).limit(1);
    if (existingUsers.length > 0) {
      // Keep name or role up to date
      const u = existingUsers[0];
      // Hardcode specific emails to admin for testing the Admin panel
      const targetRole = (email === 'asepakon74@gmail.com' || email.endsWith('@admin.com')) ? 'admin' : u.role;
      if (u.role !== targetRole) {
        await db.update(users).set({ role: targetRole, updatedAt: new Date() }).where(eq(users.id, u.id));
        u.role = targetRole;
      }
      return u;
    }

    // Determine role (make user email 'asepakon74@gmail.com' or any @admin.com an admin by default for convenience)
    const role = (email === 'asepakon74@gmail.com' || email.endsWith('@admin.com')) ? 'admin' : 'user';

    const insertedUsers = await db
      .insert(users)
      .values({
        uid,
        email,
        name,
        role,
      })
      .returning();

    return insertedUsers[0];
  } catch (error) {
    console.error('Firebase Auth Verification error:', error);
    return null;
  }
}
