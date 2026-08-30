import { db } from '@/src/db/index';
import { blacklistDomains } from '@/src/db/schema';
import { eq } from 'drizzle-orm';

/**
 * Extracts the clean domain from a URL string
 * e.g., "https://sub.phishing-site.com/login/index.html?ref=123" -> "phishing-site.com"
 */
export function extractDomain(urlStr: string): string {
  try {
    let cleanUrl = urlStr.trim();
    if (!cleanUrl.startsWith('http://') && !cleanUrl.startsWith('https://')) {
      cleanUrl = 'https://' + cleanUrl;
    }
    const urlObj = new URL(cleanUrl);
    const hostname = urlObj.hostname.toLowerCase();
    
    // Remove "www." if present to check both root and subdomains
    if (hostname.startsWith('www.')) {
      return hostname.substring(4);
    }
    return hostname;
  } catch (error) {
    return '';
  }
}

/**
 * Checks if a domain is blacklisted in the database
 */
export async function isDomainBlacklisted(urlStr: string): Promise<boolean> {
  const domain = extractDomain(urlStr);
  if (!domain) {
    return false;
  }

  try {
    // Check direct match
    const directMatch = await db
      .select()
      .from(blacklistDomains)
      .where(eq(blacklistDomains.domain, domain))
      .limit(1);

    if (directMatch.length > 0) {
      return true;
    }

    // Check parent domain match (e.g., if "badsite.com" is blacklisted, block "sub.badsite.com")
    // Let's get all blacklisted domains and check if our domain ends with any of them
    const allBanned = await db.select().from(blacklistDomains);
    return allBanned.some((banned) => {
      const bannedDomain = banned.domain.toLowerCase();
      return domain === bannedDomain || domain.endsWith('.' + bannedDomain);
    });
  } catch (error) {
    console.error('Failed to query blacklist domains:', error);
    return false;
  }
}
