import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/jwt-rbac-middleware';
import { auditLog, AuditEventType, AuditSeverity } from '@/lib/audit-log';

export const GET = requireAdmin(async (request: NextRequest) => {
  try {
    const { searchParams } = new URL(request.url);
    
    // Extract query parameters
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = (page - 1) * limit;
    
    // Filters
    const eventType = searchParams.get('eventType');
    const userId = searchParams.get('userId');
    const adminId = searchParams.get('adminId');
    const severity = searchParams.get('severity');
    const entityType = searchParams.get('entityType');
    const entityId = searchParams.get('entityId');
    const ipAddress = searchParams.get('ipAddress');
    const fromDate = searchParams.get('fromDate');
    const toDate = searchParams.get('toDate');
    
    // Parse multiple values for eventType and severity
    const eventTypes = eventType ? eventType.split(',') as AuditEventType[] : undefined;
    const severities = severity ? severity.split(',') as AuditSeverity[] : undefined;
    
    // Build filters object
    const filters: any = {
      limit,
      offset
    };
    
    if (eventTypes) filters.eventType = eventTypes.length === 1 ? eventTypes[0] : eventTypes;
    if (userId) filters.userId = userId;
    if (adminId) filters.adminId = adminId;
    if (severities) filters.severity = severities.length === 1 ? severities[0] : severities;
    if (entityType) filters.entityType = entityType;
    if (entityId) filters.entityId = entityId;
    if (ipAddress) filters.ipAddress = ipAddress;
    if (fromDate) filters.fromDate = new Date(fromDate);
    if (toDate) filters.toDate = new Date(toDate);
    
    // Query audit logs
    const { logs, total } = await auditLog.query(filters);
    
    // Calculate pagination info
    const totalPages = Math.ceil(total / limit);
    const hasNext = page < totalPages;
    const hasPrev = page > 1;
    
    return NextResponse.json({
      logs,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext,
        hasPrev
      }
    });

  } catch (error) {
    console.error('Admin audit logs error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch audit logs' },
      { status: 500 }
    );
  }
});

// Get audit log statistics
export async function POST(request: NextRequest) {
  try {
    // Verify admin authentication
    const authHeader = request.headers.get('Authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { action, timeRange, retentionDays } = body;

    if (action === 'stats') {
      const stats = await auditLog.getStats(timeRange || 'day');
      return NextResponse.json({ stats });
    }

    if (action === 'cleanup') {
      // Only allow cleanup with proper authorization
      const cleanupCount = await auditLog.cleanup(retentionDays || 90);
      return NextResponse.json({ 
        message: `Cleaned up ${cleanupCount} old audit logs`,
        count: cleanupCount 
      });
    }

    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    );

  } catch (error) {
    console.error('Audit log action error:', error);
    return NextResponse.json(
      { error: 'Failed to perform audit log action' },
      { status: 500 }
    );
  }
}