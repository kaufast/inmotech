const createNextIntlPlugin = require('next-intl/plugin');
 
const withNextIntl = createNextIntlPlugin('./src/lib/i18n.ts');

// Removed environment validation import for Next.js config safety

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['images.unsplash.com', 'unsplash.com'],
  },
  experimental: {
    outputFileTracingExcludes: {
      '*': ['./server/**/*'],
    },
  },
  optimizeFonts: false, // Disable font optimization to avoid Google Fonts timeout
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: false,
    dirs: ['src', 'app'], // Only lint these directories, exclude server
  },
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        module: false,
        net: false,
        tls: false,
        dns: false,
      };
    }
    return config;
  },
  // Environment variables that should be available on the client
  env: {
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || process.env.VERCEL_URL 
      ? `https://${process.env.VERCEL_URL}` 
      : 'http://localhost:3000',
    DATABASE_URL: process.env.DATABASE_URL,
    JWT_SECRET: process.env.JWT_SECRET,
  },
  // Enhanced security headers
  async headers() {
    const isProduction = process.env.NODE_ENV === 'production';
    
    return [
      {
        source: '/(.*)',
        headers: [
          // DNS prefetch control
          { key: 'X-DNS-Prefetch-Control', value: 'on' },
          // Clickjacking protection
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          // MIME type sniffing protection
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          // Referrer policy
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          // XSS protection
          { key: 'X-XSS-Protection', value: '1; mode=block' },
          // Remove server fingerprinting
          { key: 'X-Powered-By', value: 'InmoTech' },
          // Permissions policy
          { 
            key: 'Permissions-Policy', 
            value: 'camera=(), microphone=(), geolocation=(self), payment=(self)' 
          },
          // HSTS (only in production)
          ...(isProduction ? [
            { 
              key: 'Strict-Transport-Security', 
              value: 'max-age=31536000; includeSubDomains; preload' 
            }
          ] : []),
        ],
      },
      {
        source: '/api/:path*',
        headers: [
          // API-specific headers
          { key: 'Cache-Control', value: 'no-store, must-revalidate' },
          { key: 'X-API-Version', value: '1.0.0' },
          // Rate limiting headers
          { key: 'X-RateLimit-Limit', value: '100' },
          { key: 'X-RateLimit-Window', value: '900' },
        ],
      },
      {
        source: '/health',
        headers: [
          { key: 'Cache-Control', value: 'no-cache, no-store, must-revalidate' },
        ],
      },
    ];
  },
};

module.exports = withNextIntl(nextConfig);