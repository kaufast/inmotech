// This file configures the initialization of Sentry on the server side
import * as Sentry from '@sentry/nextjs';

const { sentryConfig, env } = require('./src/lib/env-validation');

if (sentryConfig) {
  Sentry.init({
    dsn: sentryConfig.dsn,
    environment: sentryConfig.environment,
    
    // Performance Monitoring
    tracesSampleRate: sentryConfig.tracesSampleRate,
    
    // Server-specific integrations
    integrations: [
      Sentry.httpIntegration({
        // Capture HTTP requests
        tracing: true,
      }),
      Sentry.nodeContextIntegration(),
      Sentry.localVariablesIntegration(),
    ],

    // Error filtering and processing
    beforeSend(event, hint) {
      // Filter out development errors
      if (env.NODE_ENV === 'development') {
        console.log('Sentry server event (dev):', event);
        return null;
      }

      // Add server context
      event.tags = {
        ...event.tags,
        component: 'server',
        runtime: 'nodejs',
      };

      // Filter out certain server errors
      if (event.exception) {
        const error = event.exception.values?.[0];
        
        // Filter out database connection timeouts (often transient)
        if (error?.type === 'PrismaClientKnownRequestError' && 
            error?.value?.includes('timeout')) {
          return null;
        }

        // Filter out rate limiting errors (expected behavior)
        if (error?.value?.includes('Too many requests')) {
          return null;
        }
      }

      return event;
    },

    // Transaction filtering
    beforeSendTransaction(event) {
      // Skip health check transactions
      if (event.transaction?.includes('/health') || 
          event.transaction?.includes('/_next/')) {
        return null;
      }

      // Add custom tags
      event.tags = {
        ...event.tags,
        component: 'server',
      };

      return event;
    },

    // Release and version tracking
    release: process.env.SENTRY_RELEASE || 'inmotech@1.0.0',
    
    // Sample rate for capturing profiles
    profilesSampleRate: sentryConfig.profilesSampleRate || 0.1,

    // Additional server configuration
    maxBreadcrumbs: 50,
    debug: env.NODE_ENV === 'development',
    
    // Capture unhandled promise rejections
    captureUnhandledRejections: true,
  });

  // Custom error handler for uncaught exceptions
  process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
    Sentry.captureException(error);
    // Don't exit the process in production, let PM2 handle it
    if (env.NODE_ENV !== 'production') {
      process.exit(1);
    }
  });

  process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
    Sentry.captureException(reason);
  });
}