import * as Sentry from '@sentry/nextjs';
import { env, sentryConfig } from './env-validation';

// Initialize Sentry utilities
export class MonitoringService {
  static isInitialized = false;

  static initialize() {
    if (this.isInitialized || !sentryConfig) return;
    
    // Set user context
    this.setGlobalContext();
    this.isInitialized = true;
    
    if (env.NODE_ENV === 'development') {
      console.log('📊 Monitoring service initialized');
    }
  }

  static setGlobalContext() {
    Sentry.setContext('app', {
      name: 'InmoTech',
      version: '1.0.0',
      environment: env.NODE_ENV,
    });

    Sentry.setContext('runtime', {
      node_version: process.version,
      platform: process.platform,
      arch: process.arch,
    });
  }

  // User tracking
  static setUser(user: {
    id: string;
    email?: string;
    firstName?: string;
    lastName?: string;
    role?: string;
  }) {
    Sentry.setUser({
      id: user.id,
      email: user.email,
      username: `${user.firstName || ''} ${user.lastName || ''}`.trim(),
      role: user.role,
    });
  }

  static clearUser() {
    Sentry.setUser(null);
  }

  // Error reporting
  static captureError(error: Error, context?: Record<string, any>) {
    if (!sentryConfig) {
      console.error('Error:', error, context);
      return;
    }

    if (context) {
      Sentry.withScope((scope) => {
        Object.entries(context).forEach(([key, value]) => {
          scope.setContext(key, value);
        });
        Sentry.captureException(error);
      });
    } else {
      Sentry.captureException(error);
    }
  }

  static captureMessage(message: string, level: 'info' | 'warning' | 'error' = 'info', context?: Record<string, any>) {
    if (!sentryConfig) {
      console.log(`[${level.toUpperCase()}] ${message}`, context);
      return;
    }

    if (context) {
      Sentry.withScope((scope) => {
        Object.entries(context).forEach(([key, value]) => {
          scope.setContext(key, value);
        });
        Sentry.captureMessage(message, level);
      });
    } else {
      Sentry.captureMessage(message, level);
    }
  }

  // Performance monitoring
  static startTransaction(name: string, operation: string = 'function') {
    if (!sentryConfig) return null;
    
    return Sentry.startTransaction({
      name,
      op: operation,
    });
  }

  static finishTransaction(transaction: any, context?: Record<string, any>) {
    if (!transaction) return;
    
    if (context) {
      Object.entries(context).forEach(([key, value]) => {
        transaction.setContext(key, value);
      });
    }
    
    transaction.finish();
  }

  // Span tracking for detailed performance monitoring
  static async trackSpan<T>(
    name: string,
    operation: () => Promise<T>,
    context?: Record<string, any>
  ): Promise<T> {
    if (!sentryConfig) {
      return await operation();
    }

    const transaction = Sentry.getCurrentHub().getScope()?.getTransaction();
    const span = transaction?.startChild({
      op: 'function',
      description: name,
    });

    if (context && span) {
      Object.entries(context).forEach(([key, value]) => {
        span.setData(key, value);
      });
    }

    try {
      const result = await operation();
      span?.setStatus({ code: 200, message: 'success' });
      return result;
    } catch (error) {
      span?.setStatus({ code: 500, message: 'error' });
      this.captureError(error as Error, { span: name, ...context });
      throw error;
    } finally {
      span?.finish();
    }
  }

  // Database operation monitoring
  static async trackDatabaseOperation<T>(
    operation: string,
    query: () => Promise<T>,
    metadata?: {
      table?: string;
      action?: 'select' | 'insert' | 'update' | 'delete';
      recordCount?: number;
    }
  ): Promise<T> {
    return this.trackSpan(
      `db.${operation}`,
      async () => {
        const startTime = Date.now();
        try {
          const result = await query();
          const duration = Date.now() - startTime;
          
          if (duration > env.SLOW_QUERY_THRESHOLD) {
            this.captureMessage(`Slow database query detected: ${operation}`, 'warning', {
              operation,
              duration,
              threshold: env.SLOW_QUERY_THRESHOLD,
              ...metadata,
            });
          }
          
          return result;
        } catch (error) {
          this.captureError(error as Error, {
            operation: `db.${operation}`,
            ...metadata,
          });
          throw error;
        }
      },
      {
        operation,
        ...metadata,
      }
    );
  }

  // API endpoint monitoring
  static async trackAPIEndpoint<T>(
    endpoint: string,
    method: string,
    handler: () => Promise<T>,
    userId?: string
  ): Promise<T> {
    const transaction = this.startTransaction(`${method} ${endpoint}`, 'http');
    
    try {
      if (userId) {
        transaction?.setContext('user', { id: userId });
      }
      
      const result = await handler();
      transaction?.setStatus({ code: 200, message: 'success' });
      return result;
    } catch (error) {
      transaction?.setStatus({ code: 500, message: 'error' });
      this.captureError(error as Error, {
        endpoint,
        method,
        userId,
      });
      throw error;
    } finally {
      transaction?.finish();
    }
  }

  // Business logic monitoring
  static trackBusinessEvent(event: string, data: Record<string, any>) {
    if (!sentryConfig) {
      if (env.NODE_ENV === 'development') {
        console.log(`📈 Business Event: ${event}`, data);
      }
      return;
    }

    Sentry.addBreadcrumb({
      category: 'business',
      message: event,
      data,
      level: 'info',
    });
  }

  // Security event monitoring
  static trackSecurityEvent(
    event: 'authentication_failure' | 'rate_limit_exceeded' | 'suspicious_activity' | 'permission_denied',
    data: Record<string, any>
  ) {
    this.captureMessage(`Security Event: ${event}`, 'warning', {
      security_event: event,
      ...data,
    });
  }

  // Performance monitoring for specific operations
  static async trackPropertyValuation<T>(
    propertyId: string,
    operation: () => Promise<T>
  ): Promise<T> {
    return this.trackSpan(
      'property.valuation',
      operation,
      { propertyId }
    );
  }

  static async trackInvestmentOperation<T>(
    operation: string,
    investmentId: string,
    handler: () => Promise<T>
  ): Promise<T> {
    return this.trackSpan(
      `investment.${operation}`,
      handler,
      { investmentId }
    );
  }

  // Health monitoring
  static reportHealthCheck(component: string, status: 'healthy' | 'unhealthy', details?: Record<string, any>) {
    if (status === 'unhealthy') {
      this.captureMessage(`Health check failed: ${component}`, 'error', {
        component,
        status,
        ...details,
      });
    }
  }

  // Resource monitoring
  static trackResourceUsage(metrics: {
    memoryUsage?: number;
    cpuUsage?: number;
    activeConnections?: number;
    requestCount?: number;
  }) {
    if (!sentryConfig) return;

    Sentry.setContext('resources', metrics);

    // Alert on high resource usage
    if (metrics.memoryUsage && metrics.memoryUsage > 0.9) {
      this.captureMessage('High memory usage detected', 'warning', { memoryUsage: metrics.memoryUsage });
    }
  }
}

// Initialize monitoring service
if (typeof window !== 'undefined' || env.NODE_ENV !== 'development') {
  MonitoringService.initialize();
}

// Convenience exports
export const monitoring = MonitoringService;
export const {
  captureError,
  captureMessage,
  setUser,
  clearUser,
  trackSpan,
  trackDatabaseOperation,
  trackAPIEndpoint,
  trackBusinessEvent,
  trackSecurityEvent,
} = MonitoringService;

// Error boundary helper for React components
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  fallback?: React.ComponentType<{ error: Error }>
) {
  return Sentry.withErrorBoundary(Component, {
    fallback: fallback || (({ error }) => (
      <div className="p-4 text-red-600 border border-red-200 rounded-lg">
        <h2 className="text-lg font-semibold mb-2">Something went wrong</h2>
        <p className="text-sm">{error.message}</p>
      </div>
    )),
    beforeCapture: (scope, error, errorInfo) => {
      scope.setContext('errorBoundary', {
        componentStack: errorInfo.componentStack,
      });
    },
  });
}

export default MonitoringService;