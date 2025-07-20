import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { verifyAuth } from '@/lib/auth-middleware';
import { kycService, KYCService } from '@/lib/kyc-service';

const prisma = new PrismaClient();

// POST /api/kyc - Submit KYC information
export async function POST(request: NextRequest) {
  try {
    const authResult = await verifyAuth(request);
    if (!authResult.success) {
      return NextResponse.json(
        { error: authResult.error },
        { status: 401 }
      );
    }

    const kycData = await request.json();

    // Validate required fields
    const requiredFields = [
      'firstName', 'lastName', 'dateOfBirth', 'nationality', 
      'email', 'phone', 'address', 'identityDocument', 'addressProof'
    ];

    for (const field of requiredFields) {
      if (!kycData[field]) {
        return NextResponse.json(
          { error: `Missing required field: ${field}` },
          { status: 400 }
        );
      }
    }

    // Check if user already has KYC submission
    const existingKyc = await prisma.kycSubmission.findFirst({
      where: { 
        userId: authResult.userId,
        status: { in: ['PENDING', 'APPROVED'] }
      }
    });

    if (existingKyc) {
      return NextResponse.json(
        { error: 'KYC already submitted or approved' },
        { status: 400 }
      );
    }

    // Validate document quality
    const documentValidation = kycService.validateDocumentQuality(
      kycData.identityDocument.front
    );

    if (!documentValidation.valid) {
      return NextResponse.json(
        { 
          error: 'Document quality issues',
          issues: documentValidation.issues 
        },
        { status: 400 }
      );
    }

    // Create KYC submission record
    const kycSubmission = await prisma.kycSubmission.create({
      data: {
        userId: authResult.userId,
        firstName: kycData.firstName,
        lastName: kycData.lastName,
        dateOfBirth: new Date(kycData.dateOfBirth),
        nationality: kycData.nationality,
        email: kycData.email,
        phone: kycData.phone,
        address: kycData.address,
        identityDocument: kycData.identityDocument,
        addressProof: kycData.addressProof,
        investmentExperience: kycData.investmentExperience,
        estimatedNetWorth: kycData.estimatedNetWorth,
        sourceOfFunds: kycData.sourceOfFunds,
        pep: kycData.pep || false,
        taxResident: kycData.taxResident || [],
        status: 'PENDING',
      }
    });

    // Process KYC verification
    try {
      const verificationResult = await kycService.performKYC(kycData);

      // Update submission with verification results
      const updatedSubmission = await prisma.kycSubmission.update({
        where: { id: kycSubmission.id },
        data: {
          verificationId: verificationResult.verificationId,
          confidence: verificationResult.confidence,
          status: verificationResult.status.toUpperCase() as any,
          rejectionReasons: verificationResult.reasons || [],
          verifiedAt: verificationResult.status === 'approved' ? new Date() : null,
        }
      });

      // Update user KYC status if approved
      if (verificationResult.status === 'approved') {
        await prisma.user.update({
          where: { id: authResult.userId },
          data: { kycStatus: 'APPROVED' }
        });
      }

      return NextResponse.json({
        submissionId: updatedSubmission.id,
        status: verificationResult.status,
        confidence: verificationResult.confidence,
        verificationId: verificationResult.verificationId,
        nextSteps: verificationResult.nextSteps,
      }, { status: 201 });

    } catch (verificationError) {
      console.error('KYC verification failed:', verificationError);
      
      // Update submission as failed
      await prisma.kycSubmission.update({
        where: { id: kycSubmission.id },
        data: {
          status: 'REJECTED',
          rejectionReasons: ['Verification system error'],
        }
      });

      return NextResponse.json(
        { error: 'KYC verification failed. Please try again later.' },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('KYC submission error:', error);
    return NextResponse.json(
      { error: 'Failed to process KYC submission' },
      { status: 500 }
    );
  }
}

// GET /api/kyc - Get user's KYC status
export async function GET(request: NextRequest) {
  try {
    const authResult = await verifyAuth(request);
    if (!authResult.success) {
      return NextResponse.json(
        { error: authResult.error },
        { status: 401 }
      );
    }

    const kycSubmission = await prisma.kycSubmission.findFirst({
      where: { userId: authResult.userId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        status: true,
        confidence: true,
        rejectionReasons: true,
        createdAt: true,
        verifiedAt: true,
        firstName: true,
        lastName: true,
        nationality: true,
        investmentExperience: true,
        // Don't return sensitive documents
      }
    });

    if (!kycSubmission) {
      return NextResponse.json({
        status: 'NOT_SUBMITTED',
        message: 'No KYC submission found'
      });
    }

    return NextResponse.json({
      kyc: kycSubmission,
      canResubmit: kycSubmission.status === 'REJECTED'
    });

  } catch (error) {
    console.error('KYC status fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch KYC status' },
      { status: 500 }
    );
  }
}