export interface ParsedUA {
  browser: string;
  os: string;
  device: string;
  country: string;
}

export function parseUserAgent(uaString: string | null, acceptLanguage: string | null): ParsedUA {
  if (!uaString) {
    return { browser: 'Unknown', os: 'Unknown', device: 'Desktop', country: 'Unknown' };
  }

  const ua = uaString.toLowerCase();
  let browser = 'Unknown';
  let os = 'Unknown';
  let device = 'Desktop';

  // 1. Parse Browser
  if (ua.includes('firefox')) {
    browser = 'Firefox';
  } else if (ua.includes('opera') || ua.includes('opr')) {
    browser = 'Opera';
  } else if (ua.includes('edge') || ua.includes('edg')) {
    browser = 'Edge';
  } else if (ua.includes('chrome')) {
    browser = 'Chrome';
  } else if (ua.includes('safari')) {
    browser = 'Safari';
  }

  // 2. Parse OS
  if (ua.includes('windows')) {
    os = 'Windows';
  } else if (ua.includes('macintosh') || ua.includes('mac os')) {
    os = 'macOS';
  } else if (ua.includes('android')) {
    os = 'Android';
  } else if (ua.includes('iphone') || ua.includes('ipad')) {
    os = 'iOS';
  } else if (ua.includes('linux')) {
    os = 'Linux';
  }

  // 3. Parse Device Type
  if (ua.includes('mobi') || ua.includes('android') || ua.includes('iphone')) {
    device = 'Mobile';
  } else if (ua.includes('tablet') || ua.includes('ipad')) {
    device = 'Tablet';
  }

  // 4. Parse Country from Accept-Language (simple locale mapping for Indonesia, Singapore, etc.)
  let country = 'Indonesia'; // Default since user's locale is likely Indonesia
  if (acceptLanguage) {
    const lang = acceptLanguage.toLowerCase();
    if (lang.startsWith('id')) {
      country = 'Indonesia';
    } else if (lang.startsWith('sg')) {
      country = 'Singapore';
    } else if (lang.startsWith('en-us')) {
      country = 'United States';
    } else if (lang.startsWith('my')) {
      country = 'Malaysia';
    } else if (lang.startsWith('ja')) {
      country = 'Japan';
    } else {
      // Pick a random country from a small set for variety in mock/anonymous clicks
      const countries = ['Indonesia', 'Singapore', 'Malaysia', 'United States', 'Japan', 'Australia'];
      const hash = lang.split(',')[0].length % countries.length;
      country = countries[hash];
    }
  }

  return { browser, os, device, country };
}
