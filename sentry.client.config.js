// This file configures the initialization of Sentry on the browser/client side
import * as Sentry from '@sentry/nextjs';

const { sentryConfig, env } = require('./src/lib/env-validation');

if (sentryConfig) {
  Sentry.init({
    dsn: sentryConfig.dsn,
    environment: sentryConfig.environment,
    
    // Performance Monitoring
    tracesSampleRate: sentryConfig.tracesSampleRate,
    
    // Session Replay
    replaysSessionSampleRate: 0.1, // 10% of sessions will be recorded
    replaysOnErrorSampleRate: 1.0, // 100% of sessions with errors will be recorded
    
    integrations: [
      Sentry.replayIntegration({
        // Capture 90% of all sessions with an error, 10% of all sessions
        sessionSampleRate: 0.1,
        errorSampleRate: 1.0,
      }),
      Sentry.browserTracingIntegration({
        // Enable tracing for Next.js App Router
        instrumentNavigation: true,
        instrumentPageLoad: true,
      }),
    ],

    // Error filtering
    beforeSend(event, hint) {
      // Filter out development errors
      if (env.NODE_ENV === 'development') {
        console.log('Sentry event (dev):', event);
        return null;
      }

      // Filter out certain errors
      if (event.exception) {
        const error = event.exception.values?.[0];
        if (error?.type === 'ChunkLoadError') {
          // Often caused by deployments, not critical
          return null;
        }
        if (error?.value?.includes('ResizeObserver loop limit exceeded')) {
          // Common browser issue, not actionable
          return null;
        }
      }

      return event;
    },

    // Set user context
    beforeSendTransaction(event) {
      // Add custom context
      event.tags = {
        ...event.tags,
        component: 'client',
      };
      return event;
    },

    // Privacy settings
    defaultIntegrations: false,
    integrations: [
      Sentry.inboundFiltersIntegration(),
      Sentry.functionToStringIntegration(),
      Sentry.dedupeIntegration(),
      Sentry.httpContextIntegration(),
      Sentry.browserTracingIntegration({
        // Set up automatic route change tracking for Next.js App Router
        instrumentNavigation: true,
        instrumentPageLoad: true,
      }),
    ],

    // Release tracking
    release: process.env.SENTRY_RELEASE || 'inmotech@1.0.0',
    
    // Source maps
    enableSourceMaps: true,
  });
}