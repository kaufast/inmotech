import { PrismaClient } from '@prisma/client';
import { NextRequest } from 'next/server';

const prisma = new PrismaClient();

// Event types for audit logging
export enum AuditEventType {
  // Authentication events
  LOGIN_ATTEMPT = 'login_attempt',
  LOGIN_SUCCESS = 'login_success',
  LOGIN_FAILED = 'login_failed',
  LOGOUT = 'logout',
  PASSWORD_RESET_REQUEST = 'password_reset_request',
  PASSWORD_RESET_SUCCESS = 'password_reset_success',
  PASSWORD_CHANGED = 'password_changed',
  
  // 2FA events
  TWO_FACTOR_ENABLED = '2fa_enabled',
  TWO_FACTOR_DISABLED = '2fa_disabled',
  TWO_FACTOR_VERIFY_SUCCESS = '2fa_verify_success',
  TWO_FACTOR_VERIFY_FAILED = '2fa_verify_failed',
  
  // Session events
  SESSION_CREATED = 'session_created',
  SESSION_TERMINATED = 'session_terminated',
  SESSION_EXPIRED = 'session_expired',
  
  // Email verification events
  EMAIL_VERIFICATION_SENT = 'email_verification_sent',
  EMAIL_VERIFIED = 'email_verified',
  EMAIL_VERIFICATION_FAILED = 'email_verification_failed',
  
  // Admin actions
  USER_CREATED = 'user_created',
  USER_UPDATED = 'user_updated',
  USER_DELETED = 'user_deleted',
  USER_BANNED = 'user_banned',
  USER_UNBANNED = 'user_unbanned',
  USER_ROLE_CHANGED = 'user_role_changed',
  USER_PERMISSION_CHANGED = 'user_permission_changed',
  
  // Security events
  SUSPICIOUS_ACTIVITY = 'suspicious_activity',
  ACCOUNT_LOCKED = 'account_locked',
  ACCOUNT_UNLOCKED = 'account_unlocked',
  API_KEY_CREATED = 'api_key_created',
  API_KEY_REVOKED = 'api_key_revoked',
  
  // Data access events
  DATA_EXPORTED = 'data_exported',
  SENSITIVE_DATA_ACCESSED = 'sensitive_data_accessed',
  
  // System events
  SYSTEM_ERROR = 'system_error',
  MAINTENANCE_MODE = 'maintenance_mode'
}

export enum AuditEventAction {
  SUCCESS = 'success',
  FAILURE = 'failure',
  BLOCKED = 'blocked',
  INITIATED = 'initiated',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  ERROR = 'error'
}

export enum AuditSeverity {
  INFO = 'info',
  WARNING = 'warning',
  ERROR = 'error',
  CRITICAL = 'critical'
}

interface AuditLogOptions {
  eventType: AuditEventType;
  eventAction: AuditEventAction;
  severity?: AuditSeverity;
  userId?: string;
  adminId?: string;
  entityType?: string;
  entityId?: string;
  metadata?: Record<string, any>;
  errorMessage?: string;
  request?: NextRequest;
  ipAddress?: string;
  userAgent?: string;
}

class AuditLogService {
  /**
   * Create an audit log entry
   */
  async log(options: AuditLogOptions): Promise<void> {
    try {
      // Extract IP and user agent from request if provided
      let ipAddress = options.ipAddress || 'unknown';
      let userAgent = options.userAgent || 'unknown';
      
      if (options.request) {
        // Get IP from various headers (considering proxies)
        ipAddress = 
          options.request.headers.get('x-forwarded-for')?.split(',')[0] ||
          options.request.headers.get('x-real-ip') ||
          options.request.headers.get('cf-connecting-ip') || // Cloudflare
          'unknown';
        
        userAgent = options.request.headers.get('user-agent') || 'unknown';
      }
      
      // Determine severity based on event type and action if not specified
      const severity = options.severity || this.determineSeverity(options.eventType, options.eventAction);
      
      // Create audit log entry
      await prisma.auditLog.create({
        data: {
          eventType: options.eventType,
          eventAction: options.eventAction,
          severity,
          userId: options.userId,
          adminId: options.adminId,
          entityType: options.entityType,
          entityId: options.entityId,
          ipAddress,
          userAgent,
          metadata: options.metadata,
          errorMessage: options.errorMessage,
          location: undefined // Can be populated with IP geolocation service
        }
      });
      
    } catch (error) {
      // Log to console if audit logging fails (don't throw to avoid disrupting main flow)
      console.error('Audit logging failed:', error);
    }
  }
  
  /**
   * Log a successful authentication event
   */
  async logAuthSuccess(userId: string, request: NextRequest, metadata?: Record<string, any>) {
    await this.log({
      eventType: AuditEventType.LOGIN_SUCCESS,
      eventAction: AuditEventAction.SUCCESS,
      userId,
      request,
      metadata
    });
  }
  
  /**
   * Log a failed authentication event
   */
  async logAuthFailure(email: string, reason: string, request: NextRequest) {
    await this.log({
      eventType: AuditEventType.LOGIN_FAILED,
      eventAction: AuditEventAction.FAILURE,
      severity: AuditSeverity.WARNING,
      request,
      metadata: { email, reason }
    });
  }
  
  /**
   * Log an admin action
   */
  async logAdminAction(
    adminId: string,
    eventType: AuditEventType,
    entityType: string,
    entityId: string,
    request: NextRequest,
    metadata?: Record<string, any>
  ) {
    await this.log({
      eventType,
      eventAction: AuditEventAction.SUCCESS,
      adminId,
      entityType,
      entityId,
      request,
      metadata
    });
  }
  
  /**
   * Log a security event
   */
  async logSecurityEvent(
    eventType: AuditEventType,
    severity: AuditSeverity,
    request: NextRequest,
    metadata: Record<string, any>
  ) {
    await this.log({
      eventType,
      eventAction: AuditEventAction.INITIATED,
      severity,
      request,
      metadata
    });
  }
  
  /**
   * Query audit logs with filters
   */
  async query(filters: {
    eventType?: AuditEventType | AuditEventType[];
    userId?: string;
    adminId?: string;
    severity?: AuditSeverity | AuditSeverity[];
    entityType?: string;
    entityId?: string;
    ipAddress?: string;
    fromDate?: Date;
    toDate?: Date;
    limit?: number;
    offset?: number;
  }) {
    const where: any = {};
    
    if (filters.eventType) {
      where.eventType = Array.isArray(filters.eventType) 
        ? { in: filters.eventType }
        : filters.eventType;
    }
    
    if (filters.userId) where.userId = filters.userId;
    if (filters.adminId) where.adminId = filters.adminId;
    
    if (filters.severity) {
      where.severity = Array.isArray(filters.severity)
        ? { in: filters.severity }
        : filters.severity;
    }
    
    if (filters.entityType) where.entityType = filters.entityType;
    if (filters.entityId) where.entityId = filters.entityId;
    if (filters.ipAddress) where.ipAddress = filters.ipAddress;
    
    if (filters.fromDate || filters.toDate) {
      where.createdAt = {};
      if (filters.fromDate) where.createdAt.gte = filters.fromDate;
      if (filters.toDate) where.createdAt.lte = filters.toDate;
    }
    
    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: filters.limit || 50,
        skip: filters.offset || 0,
        include: {
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true
            }
          },
          admin: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true
            }
          }
        }
      }),
      prisma.auditLog.count({ where })
    ]);
    
    return { logs, total };
  }
  
  /**
   * Get audit statistics
   */
  async getStats(timeRange: 'hour' | 'day' | 'week' | 'month' = 'day') {
    const now = new Date();
    const ranges = {
      hour: new Date(now.getTime() - 60 * 60 * 1000),
      day: new Date(now.getTime() - 24 * 60 * 60 * 1000),
      week: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
      month: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    };
    
    const fromDate = ranges[timeRange];
    
    const stats = await prisma.auditLog.groupBy({
      by: ['eventType', 'severity'],
      where: {
        createdAt: { gte: fromDate }
      },
      _count: {
        id: true
      }
    });
    
    return stats;
  }
  
  /**
   * Cleanup old audit logs (retention policy)
   */
  async cleanup(retentionDays: number = 90) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);
    
    const result = await prisma.auditLog.deleteMany({
      where: {
        createdAt: { lt: cutoffDate }
      }
    });
    
    return result.count;
  }
  
  /**
   * Determine severity based on event type and action
   */
  private determineSeverity(eventType: AuditEventType, eventAction: AuditEventAction): AuditSeverity {
    // Critical events
    if (
      eventType === AuditEventType.USER_DELETED ||
      eventType === AuditEventType.SYSTEM_ERROR ||
      (eventType === AuditEventType.LOGIN_FAILED && eventAction === AuditEventAction.BLOCKED)
    ) {
      return AuditSeverity.CRITICAL;
    }
    
    // Error events
    if (
      eventAction === AuditEventAction.ERROR ||
      eventAction === AuditEventAction.FAILURE
    ) {
      return AuditSeverity.ERROR;
    }
    
    // Warning events
    if (
      eventType === AuditEventType.SUSPICIOUS_ACTIVITY ||
      eventType === AuditEventType.ACCOUNT_LOCKED ||
      eventType === AuditEventType.LOGIN_FAILED
    ) {
      return AuditSeverity.WARNING;
    }
    
    // Default to info
    return AuditSeverity.INFO;
  }
}

// Export singleton instance
export const auditLog = new AuditLogService();