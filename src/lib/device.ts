import type { DeviceType } from '../types';

/**
 * Lightweight regex-based User-Agent parser.
 * Designed to execute in sub-millisecond time on Cloudflare Workers without heavy external libraries.
 *
 * @param userAgent User-Agent string from the incoming HTTP request
 * @returns DeviceType: "Android" | "iOS" | "Desktop" | "Other"
 */
export function detectDeviceType(userAgent: string | null | undefined): DeviceType {
  if (!userAgent) {
    return 'Other';
  }

  const ua = userAgent.toLowerCase();

  // Check for Android first
  if (ua.includes('android')) {
    return 'Android';
  }

  // Check for iOS (iPhone, iPad, iPod)
  if (ua.includes('iphone') || ua.includes('ipad') || ua.includes('ipod')) {
    return 'iOS';
  }

  // Check for Desktop operating systems
  if (
    ua.includes('windows nt') ||
    ua.includes('macintosh') ||
    ua.includes('mac os x') ||
    (ua.includes('linux') && !ua.includes('mobile')) ||
    ua.includes('cros')
  ) {
    return 'Desktop';
  }

  return 'Other';
}

/**
 * Extract client IP address from Cloudflare Workers request headers
 */
export function getClientIp(headers: Headers): string {
  return (
    headers.get('cf-connecting-ip') ||
    headers.get('x-forwarded-for')?.split(',')[0].trim() ||
    headers.get('x-real-ip') ||
    '127.0.0.1'
  );
}
