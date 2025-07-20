import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import prisma from '@/lib/prisma';
import { diditKYCService } from '@/lib/kyc/didit-service';
import { sendKYCApprovalEmail, sendKYCRejectionEmail } from '@/lib/sesClient';

/**
 * Didit KYC Webhook Handler
 * Processes KYC verification status updates from Didit
 */

export async function POST(request: NextRequest) {
  try {
    const headersList = headers();
    const signature = headersList.get('x-didit-signature') || headersList.get('authorization');
    const userAgent = headersList.get('user-agent') || '';

    // Get raw payload for signature verification
    const rawPayload = await request.text();
    
    // Verify webhook signature (skip in development)
    if (process.env.NODE_ENV === 'production' && process.env.DIDIT_WEBHOOK_SECRET) {
      if (!signature) {
        console.error('Missing Didit webhook signature');
        return NextResponse.json(
          { error: 'Missing signature' },
          { status: 401 }
        );
      }

      const isValidSignature = diditKYCService.verifyWebhookSignature(rawPayload, signature);
      if (!isValidSignature) {
        console.error('Invalid Didit webhook signature');
        return NextResponse.json(
          { error: 'Invalid signature' },
          { status: 401 }
        );
      }
    }

    // Parse webhook payload
    let payload;
    try {
      payload = JSON.parse(rawPayload);
    } catch (error) {
      console.error('Failed to parse Didit webhook payload:', error);
      return NextResponse.json(
        { error: 'Invalid JSON payload' },
        { status: 400 }
      );
    }

    // Process webhook through Didit service
    const webhookData = diditKYCService.processWebhookPayload(payload);
    
    // Handle KYC verification update
    await handleKYCVerificationUpdate(webhookData);

    // Log webhook processing
    await prisma.auditLog.create({
      data: {
        userId: webhookData.userId,
        action: 'KYC_WEBHOOK_PROCESSED',
        resource: 'KYC_VERIFICATION',
        resourceId: webhookData.sessionId,
        details: JSON.stringify({
          sessionId: webhookData.sessionId,
          status: webhookData.status,
          verificationType: webhookData.verificationType,
          riskScore: webhookData.verificationData.riskScore,
          provider: 'DIDIT'
        }),
        ipAddress: request.ip,
        userAgent: request.headers.get('user-agent'),
        severity: webhookData.status === 'completed' ? 'INFO' : 'WARN'
      }
    });

    return NextResponse.json({ 
      success: true, 
      message: 'KYC webhook processed successfully',
      sessionId: webhookData.sessionId,
      status: webhookData.status
    });

  } catch (error) {
    console.error('KYC webhook processing error:', error);
    
    // Log failed webhook
    await prisma.auditLog.create({
      data: {
        action: 'KYC_WEBHOOK_FAILED',
        resource: 'KYC_VERIFICATION',
        details: JSON.stringify({
          error: error instanceof Error ? error.message : 'Unknown error',
          stack: error instanceof Error ? error.stack : undefined
        }),
        ipAddress: request.ip,
        userAgent: request.headers.get('user-agent'),
        severity: 'ERROR'
      }
    });

    return NextResponse.json(
      { error: 'KYC webhook processing failed' },
      { status: 500 }
    );
  }
}

// ==================== KYC VERIFICATION HANDLER ====================

async function handleKYCVerificationUpdate(webhookData: any) {
  const { sessionId, userId, status, verificationType, verificationData, rejectionReason, completedAt } = webhookData;

  // Find KYC verification record
  const kycVerification = await prisma.kYCVerification.findUnique({
    where: { sessionId },
    include: {
      user: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          kycStatus: true
        }
      }
    }
  });

  if (!kycVerification) {
    console.error(`KYC verification not found for session ID: ${sessionId}`);
    return;
  }

  // Map webhook status to our KYC status
  const mappedStatus = mapWebhookStatusToKYCStatus(status);
  
  // Update KYC verification record
  const updateData: any = {
    status: mappedStatus,
    verificationData: {
      ...kycVerification.verificationData,
      ...verificationData,
      webhookReceivedAt: new Date().toISOString()
    },
    updatedAt: new Date()
  };

  if (status === 'completed') {
    updateData.verifiedAt = completedAt ? new Date(completedAt) : new Date();
    updateData.riskScore = verificationData.riskScore;
  } else if (status === 'rejected' || status === 'failed') {
    updateData.rejectionReason = rejectionReason || 'Verification failed';
  }

  await prisma.kYCVerification.update({
    where: { id: kycVerification.id },
    data: updateData
  });

  // Update user KYC status
  await updateUserKYCStatus(kycVerification.user, mappedStatus, verificationData);

  // Send notifications
  await sendKYCNotifications(kycVerification.user, mappedStatus, verificationData, rejectionReason);

  // Handle post-verification actions
  await handlePostVerificationActions(kycVerification.user, mappedStatus, verificationData);
}

function mapWebhookStatusToKYCStatus(webhookStatus: string): 'PENDING' | 'IN_REVIEW' | 'APPROVED' | 'REJECTED' | 'EXPIRED' {
  switch (webhookStatus) {
    case 'completed':
      return 'APPROVED';
    case 'rejected':
      return 'REJECTED';
    case 'in_progress':
      return 'IN_REVIEW';
    case 'failed':
      return 'REJECTED';
    case 'pending':
    default:
      return 'PENDING';
  }
}

// ==================== USER KYC STATUS UPDATE ====================

async function updateUserKYCStatus(user: any, kycStatus: string, verificationData: any) {
  const updateData: any = {
    kycStatus,
    updatedAt: new Date()
  };

  if (kycStatus === 'APPROVED') {
    updateData.kycCompletedAt = new Date();
    
    // Set investment limit based on verification level and risk score
    const investmentLimit = calculateInvestmentLimit(verificationData);
    updateData.investmentLimit = investmentLimit;

    // Update user nationality and address if verified
    if (verificationData.identity?.nationality) {
      updateData.nationality = verificationData.identity.nationality;
    }
    if (verificationData.address) {
      updateData.address = verificationData.address;
    }
    
  } else if (kycStatus === 'REJECTED') {
    // Reset KYC session ID on rejection
    updateData.kycSessionId = null;
  }

  await prisma.user.update({
    where: { id: user.id },
    data: updateData
  });
}

function calculateInvestmentLimit(verificationData: any): number {
  const riskScore = verificationData.riskScore || 0;
  const verificationType = verificationData.verificationType || 'basic';
  
  // Base limits by verification type
  let baseLimit = 5000; // Basic verification
  
  if (verificationType === 'enhanced') {
    baseLimit = 50000;
  } else if (verificationType === 'corporate') {
    baseLimit = 500000;
  }
  
  // Adjust based on risk score (lower risk = higher limit)
  const riskMultiplier = Math.max(0.1, 1 - (riskScore / 100));
  
  return Math.floor(baseLimit * riskMultiplier);
}

// ==================== NOTIFICATIONS ====================

async function sendKYCNotifications(user: any, kycStatus: string, verificationData: any, rejectionReason?: string) {
  try {
    if (kycStatus === 'APPROVED') {
      // Send approval email
      await sendKYCApprovalEmail(user.email, {
        firstName: user.firstName || 'User',
        verificationType: verificationData.verificationType || 'standard',
        investmentLimit: calculateInvestmentLimit(verificationData)
      });

      // Create in-app notification
      await prisma.notification.create({
        data: {
          userId: user.id,
          type: 'kyc_approved',
          title: 'KYC Verification Approved',
          message: 'Your identity verification has been approved. You can now start investing!',
          data: {
            kycStatus,
            investmentLimit: calculateInvestmentLimit(verificationData),
            completedAt: new Date().toISOString()
          }
        }
      });

    } else if (kycStatus === 'REJECTED') {
      // Send rejection email
      await sendKYCRejectionEmail(user.email, user.firstName || 'User', rejectionReason || 'Verification requirements not met');

      // Create in-app notification
      await prisma.notification.create({
        data: {
          userId: user.id,
          type: 'kyc_rejected',
          title: 'KYC Verification Rejected',
          message: `Your identity verification was rejected. ${rejectionReason || 'Please contact support for assistance.'}`,
          data: {
            kycStatus,
            rejectionReason,
            canRetry: true,
            supportEmail: process.env.SUPPORT_EMAIL || 'support@inmotech.com'
          }
        }
      });

    } else if (kycStatus === 'IN_REVIEW') {
      // Create in-app notification for review status
      await prisma.notification.create({
        data: {
          userId: user.id,
          type: 'kyc_in_review',
          title: 'KYC Under Review',
          message: 'Your identity verification is being reviewed. We will notify you once complete.',
          data: {
            kycStatus,
            estimatedReviewTime: '24-48 hours'
          }
        }
      });
    }

  } catch (error) {
    console.error('Failed to send KYC notifications:', error);
    // Don't fail the webhook for notification errors
  }
}

// ==================== POST-VERIFICATION ACTIONS ====================

async function handlePostVerificationActions(user: any, kycStatus: string, verificationData: any) {
  try {
    if (kycStatus === 'APPROVED') {
      // Create user wallet if not exists
      const existingWallet = await prisma.wallet.findFirst({
        where: { 
          userId: user.id,
          currency: 'EUR'
        }
      });

      if (!existingWallet) {
        await prisma.wallet.create({
          data: {
            userId: user.id,
            currency: 'EUR',
            balance: 0,
            availableBalance: 0
          }
        });
      }

      // Log successful KYC completion
      await prisma.auditLog.create({
        data: {
          userId: user.id,
          action: 'KYC_APPROVED',
          resource: 'USER',
          resourceId: user.id,
          details: JSON.stringify({
            verificationType: verificationData.verificationType,
            riskScore: verificationData.riskScore,
            investmentLimit: calculateInvestmentLimit(verificationData),
            nationality: verificationData.identity?.nationality
          }),
          severity: 'INFO'
        }
      });

      // TODO: Integrate with compliance monitoring system
      // TODO: Schedule periodic KYC reviews if required by jurisdiction

    } else if (kycStatus === 'REJECTED') {
      // Log KYC rejection
      await prisma.auditLog.create({
        data: {
          userId: user.id,
          action: 'KYC_REJECTED',
          resource: 'USER',
          resourceId: user.id,
          details: JSON.stringify({
            rejectionReason: verificationData.rejectionReason,
            riskScore: verificationData.riskScore,
            canRetry: true
          }),
          severity: 'WARN'
        }
      });

      // Cancel any pending investments
      await prisma.investment.updateMany({
        where: {
          userId: user.id,
          status: {
            in: ['PENDING', 'PAYMENT_REQUIRED']
          }
        },
        data: {
          status: 'CANCELLED',
          cancelledAt: new Date()
        }
      });
    }

  } catch (error) {
    console.error('Failed to handle post-verification actions:', error);
    // Don't fail the webhook for post-processing errors
  }
}

// ==================== MOCK WEBHOOK ENDPOINT ====================

export async function GET(request: NextRequest) {
  // For testing in development - simulate KYC completion
  const { searchParams } = new URL(request.url);
  const sessionId = searchParams.get('sessionId');
  const status = searchParams.get('status') || 'completed';

  if (!sessionId) {
    return NextResponse.json(
      { error: 'sessionId parameter required' },
      { status: 400 }
    );
  }

  if (process.env.NODE_ENV === 'development') {
    // Find the KYC verification
    const kycVerification = await prisma.kYCVerification.findUnique({
      where: { sessionId },
      include: { user: true }
    });

    if (!kycVerification) {
      return NextResponse.json(
        { error: 'KYC session not found' },
        { status: 404 }
      );
    }

    // Create mock webhook payload
    const mockPayload = diditKYCService.createMockWebhookPayload(
      sessionId,
      kycVerification.userId,
      status as 'completed' | 'rejected'
    );

    // Process the mock webhook
    await handleKYCVerificationUpdate(mockPayload);

    return NextResponse.json({
      message: 'Mock KYC webhook processed',
      sessionId,
      status,
      mockPayload
    });
  }

  return NextResponse.json(
    { error: 'Mock webhook only available in development' },
    { status: 403 }
  );
}