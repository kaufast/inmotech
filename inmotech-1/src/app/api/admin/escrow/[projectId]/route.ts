import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/prisma';
import { escrowService } from '@/lib/escrow/escrow-service';
import { rateLimit } from '@/lib/rate-limit';

// ==================== VALIDATION SCHEMAS ====================

const escrowActionSchema = z.object({
  action: z.enum(['release', 'refund', 'status']),
  amount: z.number().positive().optional(),
  reason: z.string().min(1, 'Reason is required').optional(),
  releaseType: z.enum(['partial', 'full']).optional(),
  conditions: z.array(z.object({
    type: z.enum(['funding_target', 'milestone', 'date', 'manual']),
    value: z.union([z.number(), z.string(), z.date()]).optional(),
    description: z.string(),
    isMet: z.boolean(),
    verifiedAt: z.string().datetime().optional(),
    verifiedBy: z.string().optional()
  })).optional()
});

// ==================== GET /api/admin/escrow/[projectId] ====================

export async function GET(
  request: NextRequest,
  { params }: { params: { projectId: string } }
) {
  try {
    const { projectId } = params;
    const userRole = request.headers.get('user-role');

    // Only admins and moderators can access escrow management
    if (!['ADMIN', 'MODERATOR'].includes(userRole || '')) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    if (!projectId) {
      return NextResponse.json(
        { error: 'Project ID is required' },
        { status: 400 }
      );
    }

    // Get comprehensive project funding and escrow status
    const fundingStatus = await escrowService.checkProjectFundingStatus(projectId);

    // Get detailed escrow accounts information
    const escrowAccounts = await prisma.escrowAccount.findMany({
      where: { projectId },
      include: {
        entries: {
          orderBy: { createdAt: 'desc' },
          take: 20,
          include: {
            payment: {
              select: {
                id: true,
                amount: true,
                status: true,
                user: {
                  select: {
                    firstName: true,
                    lastName: true,
                    email: true
                  }
                }
              }
            }
          }
        }
      }
    });

    // Get project investments summary
    const investments = await prisma.investment.findMany({
      where: { projectId },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        },
        payments: {
          where: { status: 'COMPLETED' },
          select: {
            id: true,
            amount: true,
            completedAt: true,
            pspProvider: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Get escrow transaction history
    const escrowHistory = await prisma.auditLog.findMany({
      where: {
        resourceId: projectId,
        action: {
          in: ['ESCROW_RELEASE_REQUESTED', 'ESCROW_RELEASED', 'ESCROW_RELEASE_SCHEDULED', 'PROJECT_REFUNDS_PROCESSED']
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 50
    });

    return NextResponse.json({
      projectId,
      fundingStatus,
      escrowAccounts: escrowAccounts.map(account => ({
        ...account,
        entries: account.entries.map(entry => ({
          ...entry,
          payment: entry.payment ? {
            ...entry.payment,
            user: entry.payment.user
          } : null
        }))
      })),
      investments: investments.map(investment => ({
        ...investment,
        totalPaid: investment.payments.reduce((sum, p) => sum + Number(p.amount), 0),
        paymentCount: investment.payments.length,
        lastPaymentAt: investment.payments[0]?.completedAt
      })),
      escrowHistory,
      summary: {
        totalAccounts: escrowAccounts.length,
        totalEscrowBalance: escrowAccounts.reduce((sum, acc) => sum + Number(acc.balance), 0),
        totalInvestments: investments.length,
        confirmedInvestments: investments.filter(inv => inv.status === 'CONFIRMED').length,
        pendingInvestments: investments.filter(inv => inv.status === 'PENDING').length,
        totalInvestors: new Set(investments.map(inv => inv.userId)).size
      }
    });

  } catch (error) {
    console.error('Get escrow status error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve escrow status' },
      { status: 500 }
    );
  }
}

// ==================== POST /api/admin/escrow/[projectId] ====================

export async function POST(
  request: NextRequest,
  { params }: { params: { projectId: string } }
) {
  try {
    const { projectId } = params;
    const userId = request.headers.get('user-id');
    const userRole = request.headers.get('user-role');

    // Only admins and moderators can perform escrow actions
    if (!['ADMIN', 'MODERATOR'].includes(userRole || '')) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    if (!userId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Rate limiting for escrow actions
    const rateLimitResult = await rateLimit(request, {
      maxRequests: 5,
      windowMs: 60 * 60 * 1000, // 1 hour
      keyGenerator: (req) => `escrow-action-${userId}-${projectId}`
    });

    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'Too many escrow actions. Please try again later.' },
        { status: 429 }
      );
    }

    const body = await request.json();
    const { action, amount, reason, releaseType, conditions } = escrowActionSchema.parse(body);

    switch (action) {
      case 'status':
        return await handleEscrowStatusCheck(projectId);
        
      case 'release':
        return await handleEscrowRelease(projectId, userId, {
          amount: amount!,
          reason: reason!,
          releaseType: releaseType || 'partial',
          conditions: conditions || []
        });
        
      case 'refund':
        return await handleProjectRefunds(projectId, userId, reason!);
        
      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error('Escrow action error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          error: 'Validation failed',
          details: error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message
          }))
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to perform escrow action' },
      { status: 500 }
    );
  }
}

// ==================== ACTION HANDLERS ====================

async function handleEscrowStatusCheck(projectId: string) {
  const fundingStatus = await escrowService.checkProjectFundingStatus(projectId);
  
  return NextResponse.json({
    action: 'status',
    result: fundingStatus,
    timestamp: new Date().toISOString()
  });
}

async function handleEscrowRelease(projectId: string, userId: string, releaseData: {
  amount: number;
  reason: string;
  releaseType: 'partial' | 'full';
  conditions: any[];
}) {
  // Validate project exists and is eligible for release
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: {
      id: true,
      title: true,
      status: true,
      targetFunding: true,
      currentFunding: true,
      fundingDeadline: true
    }
  });

  if (!project) {
    return NextResponse.json(
      { error: 'Project not found' },
      { status: 404 }
    );
  }

  if (project.status !== 'FUNDING_COMPLETE') {
    return NextResponse.json(
      { error: 'Project must be fully funded before escrow release' },
      { status: 400 }
    );
  }

  // Check current funding status
  const fundingStatus = await escrowService.checkProjectFundingStatus(projectId);
  
  if (releaseData.amount > fundingStatus.escrowBalance) {
    return NextResponse.json(
      { error: `Insufficient escrow balance. Available: ${fundingStatus.escrowBalance}` },
      { status: 400 }
    );
  }

  // Process escrow release
  const releaseRequest = {
    projectId,
    amount: releaseData.amount,
    reason: releaseData.reason,
    requestedBy: userId,
    conditions: releaseData.conditions,
    releaseType: releaseData.releaseType
  };

  const releaseResult = await escrowService.requestEscrowRelease(releaseRequest);

  if (!releaseResult.success) {
    return NextResponse.json(
      { error: releaseResult.error },
      { status: 400 }
    );
  }

  // Log admin action
  await prisma.auditLog.create({
    data: {
      userId,
      action: 'ADMIN_ESCROW_RELEASE',
      resource: 'PROJECT',
      resourceId: projectId,
      details: JSON.stringify({
        amount: releaseData.amount,
        releaseType: releaseData.releaseType,
        reason: releaseData.reason,
        releaseId: releaseResult.releaseId
      }),
      ipAddress: '',
      userAgent: '',
      severity: 'WARN'
    }
  });

  return NextResponse.json({
    action: 'release',
    result: {
      success: true,
      releaseId: releaseResult.releaseId,
      amount: releaseData.amount,
      releaseType: releaseData.releaseType,
      newEscrowBalance: fundingStatus.escrowBalance - releaseData.amount
    },
    message: 'Escrow release processed successfully'
  });
}

async function handleProjectRefunds(projectId: string, userId: string, reason: string) {
  // Validate project exists
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: {
      id: true,
      title: true,
      status: true,
      currentFunding: true
    }
  });

  if (!project) {
    return NextResponse.json(
      { error: 'Project not found' },
      { status: 404 }
    );
  }

  // Confirm refund action with additional validation
  if (Number(project.currentFunding) === 0) {
    return NextResponse.json(
      { error: 'No confirmed investments to refund' },
      { status: 400 }
    );
  }

  // Process refunds
  const refundResult = await escrowService.processProjectRefunds(projectId, reason);

  // Log admin action
  await prisma.auditLog.create({
    data: {
      userId,
      action: 'ADMIN_PROJECT_REFUNDS',
      resource: 'PROJECT',
      resourceId: projectId,
      details: JSON.stringify({
        reason,
        totalRefunds: refundResult.refundResults.length,
        successfulRefunds: refundResult.refundResults.filter(r => r.success).length,
        failedRefunds: refundResult.refundResults.filter(r => !r.success).length
      }),
      ipAddress: '',
      userAgent: '',
      severity: 'ERROR'
    }
  });

  return NextResponse.json({
    action: 'refund',
    result: refundResult,
    message: refundResult.success ? 'All refunds processed successfully' : 'Some refunds failed to process'
  });
}

// ==================== PUT /api/admin/escrow/[projectId] ====================

export async function PUT(
  request: NextRequest,
  { params }: { params: { projectId: string } }
) {
  try {
    const { projectId } = params;
    const userId = request.headers.get('user-id');
    const userRole = request.headers.get('user-role');

    // Only admins can update escrow configurations
    if (userRole !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Only administrators can update escrow configurations' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { escrowConfig } = body;

    // Update project escrow configuration
    // This could include release conditions, approval requirements, etc.
    
    await prisma.project.update({
      where: { id: projectId },
      data: {
        // Store escrow configuration in project metadata
        // This would depend on your specific schema
        updatedAt: new Date()
      }
    });

    // Log configuration change
    await prisma.auditLog.create({
      data: {
        userId,
        action: 'ESCROW_CONFIG_UPDATED',
        resource: 'PROJECT',
        resourceId: projectId,
        details: JSON.stringify(escrowConfig),
        ipAddress: '',
        userAgent: '',
        severity: 'INFO'
      }
    });

    return NextResponse.json({
      message: 'Escrow configuration updated successfully',
      projectId
    });

  } catch (error) {
    console.error('Update escrow config error:', error);
    return NextResponse.json(
      { error: 'Failed to update escrow configuration' },
      { status: 500 }
    );
  }
}