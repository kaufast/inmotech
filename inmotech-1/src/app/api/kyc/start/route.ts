import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/prisma';
import { diditKYCService } from '@/lib/kyc/didit-service';
import { rateLimit } from '@/lib/rate-limit';

// ==================== VALIDATION SCHEMAS ====================

const startKYCSchema = z.object({
  verificationType: z.enum(['basic', 'enhanced', 'corporate']).default('enhanced'),
  documentTypes: z.array(z.enum(['passport', 'drivers_license', 'national_id', 'utility_bill', 'bank_statement'])).min(1, 'At least one document type is required'),
  redirectUrl: z.string().url('Invalid redirect URL').optional(),
  nationality: z.string().length(2, 'Invalid nationality code').optional(),
  dateOfBirth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)').optional()
});

// ==================== POST /api/kyc/start ====================

export async function POST(request: NextRequest) {
  try {
    // Rate limiting: 3 KYC session starts per hour per user
    const rateLimitResult = await rateLimit(request, {
      maxRequests: 3,
      windowMs: 60 * 60 * 1000,
      keyGenerator: (req) => `kyc-start-${req.headers.get('user-id')}`
    });

    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'Too many KYC session attempts. Please try again later.' },
        { status: 429 }
      );
    }

    const userId = request.headers.get('user-id');

    if (!userId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Get user details
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        dateOfBirth: true,
        nationality: true,
        kycStatus: true,
        kycCompletedAt: true,
        kycVerifications: {
          where: {
            status: {
              in: ['PENDING', 'IN_REVIEW']
            }
          },
          orderBy: { createdAt: 'desc' },
          take: 1
        }
      }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Check if user already has approved KYC
    if (user.kycStatus === 'APPROVED') {
      return NextResponse.json(
        { 
          error: 'KYC already approved',
          kycStatus: user.kycStatus,
          completedAt: user.kycCompletedAt
        },
        { status: 400 }
      );
    }

    // Check if user has a pending KYC session
    if (user.kycVerifications.length > 0) {
      const existingSession = user.kycVerifications[0];
      
      // Check if session is still valid (within 24 hours)
      const sessionAge = Date.now() - existingSession.createdAt.getTime();
      const sessionValidHours = 24 * 60 * 60 * 1000; // 24 hours

      if (sessionAge < sessionValidHours) {
        return NextResponse.json(
          { 
            error: 'KYC verification already in progress',
            sessionId: existingSession.sessionId,
            status: existingSession.status,
            createdAt: existingSession.createdAt
          },
          { status: 400 }
        );
      }
    }

    const body = await request.json();
    const { verificationType, documentTypes, redirectUrl, nationality, dateOfBirth } = startKYCSchema.parse(body);

    // Prepare KYC session request
    const kycRequest = {
      userId: user.id,
      userEmail: user.email,
      userFirstName: user.firstName || '',
      userLastName: user.lastName || '',
      userPhone: user.phone || undefined,
      userDateOfBirth: dateOfBirth || (user.dateOfBirth ? user.dateOfBirth.toISOString().split('T')[0] : undefined),
      userNationality: nationality || user.nationality || undefined,
      verificationType,
      documentTypes,
      redirectUrl: redirectUrl || `${process.env.FRONTEND_URL}/dashboard/kyc/complete`,
      webhookUrl: `${process.env.API_URL}/api/kyc/webhook`,
      metadata: {
        userId: user.id,
        userEmail: user.email,
        platform: 'InmoTech',
        version: '1.0'
      }
    };

    let kycSession;
    
    // Create KYC session (use mock in development)
    if (process.env.NODE_ENV === 'production' && process.env.DIDIT_API_KEY) {
      kycSession = await diditKYCService.createVerificationSession(kycRequest);
    } else {
      // Mock implementation for development
      kycSession = await diditKYCService.createMockSession(kycRequest);
    }

    // Store KYC verification record
    const kycVerification = await prisma.kYCVerification.create({
      data: {
        userId: user.id,
        sessionId: kycSession.sessionId,
        status: 'PENDING',
        verificationType,
        documentTypes,
        expiresAt: kycSession.expiresAt,
        verificationData: {
          requestedDocuments: documentTypes,
          redirectUrl: kycRequest.redirectUrl,
          requestedAt: new Date().toISOString()
        }
      }
    });

    // Update user KYC status
    await prisma.user.update({
      where: { id: user.id },
      data: {
        kycStatus: 'PENDING',
        kycSessionId: kycSession.sessionId
      }
    });

    // Log KYC session creation
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'KYC_SESSION_CREATED',
        resource: 'KYC_VERIFICATION',
        resourceId: kycVerification.id,
        details: JSON.stringify({
          sessionId: kycSession.sessionId,
          verificationType,
          documentTypes,
          provider: 'DIDIT'
        }),
        ipAddress: request.ip,
        userAgent: request.headers.get('user-agent'),
        severity: 'INFO'
      }
    });

    // Create notification
    await prisma.notification.create({
      data: {
        userId: user.id,
        type: 'kyc_session_created',
        title: 'KYC Verification Started',
        message: 'Your identity verification session has been created. Please complete the verification process.',
        data: {
          sessionId: kycSession.sessionId,
          verificationType,
          expiresAt: kycSession.expiresAt.toISOString()
        }
      }
    });

    return NextResponse.json({
      sessionId: kycSession.sessionId,
      verificationUrl: kycSession.verificationUrl,
      status: kycSession.status,
      verificationType,
      documentTypes,
      expiresAt: kycSession.expiresAt,
      redirectUrl: kycRequest.redirectUrl,
      message: 'KYC verification session created successfully. Please complete the verification process.'
    }, { status: 201 });

  } catch (error) {
    console.error('KYC session creation error:', error);
    
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

    // Log failed KYC session
    await prisma.auditLog.create({
      data: {
        userId: request.headers.get('user-id'),
        action: 'KYC_SESSION_FAILED',
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
      { error: 'Failed to create KYC verification session. Please try again.' },
      { status: 500 }
    );
  }
}

// ==================== GET /api/kyc/start ====================

export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get('user-id');

    if (!userId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Get user's latest KYC verification
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        kycStatus: true,
        kycCompletedAt: true,
        kycSessionId: true,
        kycVerifications: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: {
            id: true,
            sessionId: true,
            status: true,
            verificationType: true,
            documentTypes: true,
            expiresAt: true,
            verifiedAt: true,
            rejectionReason: true,
            createdAt: true
          }
        }
      }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const latestVerification = user.kycVerifications[0];

    // Get current session status from Didit if there's an active session
    let currentSessionData = null;
    if (latestVerification && latestVerification.status === 'PENDING') {
      if (process.env.NODE_ENV === 'production' && process.env.DIDIT_API_KEY) {
        currentSessionData = await diditKYCService.getVerificationSession(latestVerification.sessionId);
      }
    }

    return NextResponse.json({
      kycStatus: user.kycStatus,
      kycCompletedAt: user.kycCompletedAt,
      currentSession: latestVerification ? {
        id: latestVerification.id,
        sessionId: latestVerification.sessionId,
        status: latestVerification.status,
        verificationType: latestVerification.verificationType,
        documentTypes: latestVerification.documentTypes,
        expiresAt: latestVerification.expiresAt,
        verifiedAt: latestVerification.verifiedAt,
        rejectionReason: latestVerification.rejectionReason,
        createdAt: latestVerification.createdAt,
        isExpired: latestVerification.expiresAt < new Date(),
        ...currentSessionData
      } : null,
      availableVerificationTypes: ['basic', 'enhanced', 'corporate'],
      supportedDocuments: ['passport', 'drivers_license', 'national_id', 'utility_bill', 'bank_statement'],
      requirements: {
        basic: ['passport OR drivers_license OR national_id'],
        enhanced: ['passport OR drivers_license OR national_id', 'utility_bill OR bank_statement'],
        corporate: ['corporate_documents', 'beneficial_owner_documents']
      }
    });

  } catch (error) {
    console.error('Get KYC status error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve KYC status' },
      { status: 500 }
    );
  }
}