// import * as Sentry from '@sentry/nextjs';
import { sentryConfig } from './env-validation';

// Simplified monitoring service
class MonitoringService {
  // Error tracking
  static captureError(error: Error, context?: Record<string, any>) {
    console.error('Error:', error.message, context);
    // if (sentryConfig) {
    //   Sentry.captureException(error, {
    //     contexts: context,
    //   });
    // }
  }

  // Log message
  static logMessage(message: string, level: 'debug' | 'info' | 'warning' | 'error' = 'info') {
    console.log(`[${level.toUpperCase()}]`, message);
    // if (sentryConfig) {
    //   Sentry.captureMessage(message, level);
    // }
  }

  // Business metrics
  static trackBusinessMetric(metric: string, value: number, tags?: Record<string, string>) {
    console.log(`Metric: ${metric} = ${value}`, tags);
  }

  // Performance tracking
  static async trackPerformance<T>(
    name: string,
    operation: () => Promise<T>,
    context?: Record<string, any>
  ): Promise<T> {
    const start = Date.now();
    try {
      const result = await operation();
      const duration = Date.now() - start;
      console.log(`Performance: ${name} took ${duration}ms`, context);
      return result;
    } catch (error) {
      const duration = Date.now() - start;
      console.error(`Performance: ${name} failed after ${duration}ms`, error);
      throw error;
    }
  }

  // API performance
  static trackApiPerformance(route: string, method: string, statusCode: number, duration: number) {
    console.log(`API: ${method} ${route} - ${statusCode} (${duration}ms)`);
  }

  // User activity
  static trackUserActivity(userId: string, action: string, metadata?: Record<string, any>) {
    console.log(`User ${userId}: ${action}`, metadata);
  }

  // Health check reporting
  static reportHealthCheck(service: string, status: string, details?: Record<string, any>) {
    console.log(`Health check: ${service} is ${status}`, details);
  }

  // Stubs for compatibility
  static startTransaction(name: string, operation: string = 'function') {
    return null;
  }

  static finishTransaction(transaction: any, context?: Record<string, any>) {
    // No-op
  }

  static async trackSpan<T>(
    name: string,
    operation: () => Promise<T>,
    metadata?: Record<string, any>
  ): Promise<T> {
    return this.trackPerformance(name, operation, metadata);
  }
}

// Export the monitoring service
export const monitoring = MonitoringService;
export const {
  captureError,
  logMessage,
  trackBusinessMetric,
  trackPerformance,
  trackApiPerformance,
  trackUserActivity,
  reportHealthCheck,
  startTransaction,
  finishTransaction,
  trackSpan,
} = MonitoringService;