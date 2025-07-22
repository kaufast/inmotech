interface DeviceInfo {
  os: string;
  browser: string;
  version: string;
  device: string;
  isMobile: boolean;
}

interface LocationInfo {
  country?: string;
  region?: string;
  city?: string;
  timezone?: string;
}

export function parseUserAgent(userAgent: string): DeviceInfo {
  const ua = userAgent.toLowerCase();
  
  // Detect OS
  let os = 'Unknown';
  if (ua.includes('windows nt')) {
    os = 'Windows';
  } else if (ua.includes('macintosh') || ua.includes('mac os x')) {
    os = 'macOS';
  } else if (ua.includes('linux')) {
    os = 'Linux';
  } else if (ua.includes('android')) {
    os = 'Android';
  } else if (ua.includes('iphone') || ua.includes('ipad')) {
    os = 'iOS';
  }

  // Detect browser
  let browser = 'Unknown';
  let version = 'Unknown';
  
  if (ua.includes('firefox')) {
    browser = 'Firefox';
    const match = ua.match(/firefox\/(\d+\.\d+)/);
    if (match) version = match[1];
  } else if (ua.includes('chrome') && !ua.includes('edg')) {
    browser = 'Chrome';
    const match = ua.match(/chrome\/(\d+\.\d+)/);
    if (match) version = match[1];
  } else if (ua.includes('safari') && !ua.includes('chrome')) {
    browser = 'Safari';
    const match = ua.match(/version\/(\d+\.\d+)/);
    if (match) version = match[1];
  } else if (ua.includes('edg')) {
    browser = 'Edge';
    const match = ua.match(/edg\/(\d+\.\d+)/);
    if (match) version = match[1];
  }

  // Detect device type
  let device = 'Desktop';
  const isMobile = ua.includes('mobile') || ua.includes('android') || ua.includes('iphone');
  
  if (ua.includes('tablet') || ua.includes('ipad')) {
    device = 'Tablet';
  } else if (isMobile) {
    device = 'Mobile';
  }

  return {
    os,
    browser,
    version,
    device,
    isMobile
  };
}

export async function getLocationFromIP(ipAddress: string): Promise<LocationInfo | null> {
  try {
    // Use ipapi.co for location lookup (free tier available)
    const response = await fetch(`https://ipapi.co/${ipAddress}/json/`);
    if (!response.ok) return null;
    
    const data = await response.json();
    
    return {
      country: data.country_name,
      region: data.region,
      city: data.city,
      timezone: data.timezone
    };
  } catch (error) {
    console.error('Location detection error:', error);
    return null;
  }
}

export function getClientIP(request: Request): string {
  // Check various headers for the real IP address
  const xForwardedFor = request.headers.get('x-forwarded-for');
  const xRealIP = request.headers.get('x-real-ip');
  const cfConnectingIP = request.headers.get('cf-connecting-ip');
  
  if (cfConnectingIP) return cfConnectingIP;
  if (xRealIP) return xRealIP;
  if (xForwardedFor) return xForwardedFor.split(',')[0].trim();
  
  return '127.0.0.1'; // Fallback for localhost
}

export function generateSessionToken(): string {
  return crypto.randomUUID() + '-' + Date.now();
}