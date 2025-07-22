// This file configures the initialization of Sentry for edge runtime (middleware, etc.)
import * as Sentry from '@sentry/nextjs';

const sentryConfig = {
  dsn: process.env.SENTRY_DSN,
  environment: process.env.SENTRY_ENVIRONMENT || process.env.NODE_ENV || 'development',
  tracesSampleRate: parseFloat(process.env.SENTRY_TRACES_SAMPLE_RATE || '0.1'),
};

if (sentryConfig.dsn && process.env.ENABLE_SENTRY === 'true') {
  Sentry.init({
    dsn: sentryConfig.dsn,
    environment: sentryConfig.environment,
    
    // Performance Monitoring
    tracesSampleRate: sentryConfig.tracesSampleRate,
    
    // Edge-specific configuration
    integrations: [
      // Minimal integrations for edge runtime
    ],

    // Error filtering for edge runtime
    beforeSend(event, hint) {
      // Filter out development errors
      if (sentryConfig.environment === 'development') {
        console.log('Sentry edge event (dev):', event);
        return null;
      }

      // Add edge runtime context
      event.tags = {
        ...event.tags,
        component: 'edge',
        runtime: 'edge',
      };

      return event;
    },

    // Release tracking
    release: process.env.SENTRY_RELEASE || 'inmotech@1.0.0',
    
    // Edge runtime constraints
    maxBreadcrumbs: 20, // Lower limit for edge
    debug: false,
  });
}