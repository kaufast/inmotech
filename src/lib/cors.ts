export interface CorsOptions {
  origin?: string | string[] | boolean;
  methods?: string[];
  headers?: string[];
  credentials?: boolean;
}

export function corsHeaders(options: CorsOptions = {}): Record<string, string> {
  const headers: Record<string, string> = {};

  // Handle origin
  if (options.origin !== undefined) {
    if (options.origin === true) {
      headers['Access-Control-Allow-Origin'] = '*';
    } else if (typeof options.origin === 'string') {
      headers['Access-Control-Allow-Origin'] = options.origin;
    } else if (Array.isArray(options.origin)) {
      // In production, you'd check the request origin against this list
      headers['Access-Control-Allow-Origin'] = options.origin[0];
    }
  } else {
    // Default: Allow specific origins based on environment
    const allowedOrigins = process.env.NODE_ENV === 'production'
      ? ['https://inmotech.vercel.app', 'https://inmote.ch']
      : ['http://localhost:3000', 'http://localhost:3001'];
    headers['Access-Control-Allow-Origin'] = allowedOrigins[0];
  }

  // Handle methods
  const methods = options.methods || ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'];
  headers['Access-Control-Allow-Methods'] = methods.join(', ');

  // Handle headers
  const allowedHeaders = options.headers || [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'Accept',
    'Origin'
  ];
  headers['Access-Control-Allow-Headers'] = allowedHeaders.join(', ');

  // Handle credentials
  if (options.credentials) {
    headers['Access-Control-Allow-Credentials'] = 'true';
  }

  // Max age for preflight caching
  headers['Access-Control-Max-Age'] = '86400'; // 24 hours

  return headers;
}