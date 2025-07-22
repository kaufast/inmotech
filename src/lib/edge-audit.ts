import { AuditEventType, AuditEventAction, AuditSeverity } from './audit-log';

/**
 * Edge-compatible audit logger that sends audit events to the audit log API
 * This is used by edge runtime functions that can't directly access Prisma
 */
export async function sendAuditLog(params: {
  eventType: AuditEventType;
  eventAction: AuditEventAction;
  severity?: AuditSeverity;
  userId?: string;
  adminId?: string;
  entityType?: string;
  entityId?: string;
  metadata?: Record<string, any>;
  errorMessage?: string;
  ipAddress: string;
  userAgent: string;
}) {
  try {
    const baseUrl = process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const internalSecret = process.env.INTERNAL_API_SECRET || 'fallback-secret';
    
    // Send audit log to internal API
    await fetch(`${baseUrl}/api/audit/log`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${internalSecret}`
      },
      body: JSON.stringify(params)
    });
  } catch (error) {
    // Log to console if audit logging fails (don't throw to avoid disrupting main flow)
    console.error('Edge audit logging failed:', error);
  }
}

/**
 * Extract client info from request for audit logging
 */
export function extractClientInfo(request: Request): { ipAddress: string; userAgent: string } {
  const headers = request.headers;
  
  // Get IP from various headers (considering proxies)
  const ipAddress = 
    headers.get('x-forwarded-for')?.split(',')[0] ||
    headers.get('x-real-ip') ||
    headers.get('cf-connecting-ip') || // Cloudflare
    'unknown';
  
  const userAgent = headers.get('user-agent') || 'unknown';
  
  return { ipAddress, userAgent };
}