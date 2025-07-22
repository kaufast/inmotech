import { NextRequest, NextResponse } from 'next/server';
import { auditLog, AuditEventType, AuditEventAction, AuditSeverity } from '@/lib/audit-log';

// This endpoint is for internal use only - accepts audit log entries from edge functions
export async function POST(request: NextRequest) {
  try {
    // Security: Only allow this endpoint to be called from internal sources
    const authHeader = request.headers.get('Authorization');
    const internalSecret = process.env.INTERNAL_API_SECRET || 'fallback-secret';
    
    if (authHeader !== `Bearer ${internalSecret}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const {
      eventType,
      eventAction,
      severity,
      userId,
      adminId,
      entityType,
      entityId,
      metadata,
      errorMessage,
      ipAddress,
      userAgent
    } = body;

    // Validate required fields
    if (!eventType || !eventAction || !ipAddress || !userAgent) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Log the audit event
    await auditLog.log({
      eventType,
      eventAction,
      severity,
      userId,
      adminId,
      entityType,
      entityId,
      metadata,
      errorMessage,
      ipAddress,
      userAgent
    });

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Audit log API error:', error);
    return NextResponse.json(
      { error: 'Failed to create audit log' },
      { status: 500 }
    );
  }
}