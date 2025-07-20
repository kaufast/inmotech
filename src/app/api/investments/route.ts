import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { verifyAuth } from '@/lib/auth-middleware';
import { emailService } from '@/lib/email';
import { processPayment } from '@/lib/payment-processor';
import { createEscrowTransaction } from '@/lib/escrow';

const prisma = new PrismaClient();

// POST /api/investments - Create new investment
export async function POST(request: NextRequest) {
  try {
    const authResult = await verifyAuth(request);
    if (!authResult.success) {
      return NextResponse.json(
        { error: authResult.error },
        { status: 401 }
      );
    }

    const { projectId, amount, paymentMethod, paymentDetails } = await request.json();

    // Validate investment
    const project = await prisma.project.findUnique({
      where: { id: projectId }
    });

    if (!project || project.status !== 'ACTIVE') {
      return NextResponse.json(
        { error: 'Project not available for investment' },
        { status: 400 }
      );
    }

    // Check user KYC status
    const user = await prisma.user.findUnique({
      where: { id: authResult.userId }
    });

    if (!user?.isVerified || user.kycStatus !== 'APPROVED') {
      return NextResponse.json(
        { error: 'KYC verification required' },
        { status: 400 }
      );
    }

    // Check minimum investment
    if (amount < project.minimumInvestment) {
      return NextResponse.json(
        { error: `Minimum investment is ${project.minimumInvestment} ${project.currency}` },
        { status: 400 }
      );
    }

    // Create investment record
    const investment = await prisma.investment.create({
      data: {
        userId: authResult.userId!,
        projectId: projectId as string,
        amount: amount as number,
        currency: project.currency,
        status: 'PENDING',
        paymentMethod: paymentMethod as string,
      }
    });

    try {
      // Process payment based on user location/currency
      const paymentResult = await processPayment({
        amount,
        currency: project.currency,
        method: paymentMethod,
        details: paymentDetails,
        metadata: {
          investmentId: investment.id,
          projectId: projectId as string,
          userId: authResult.userId!,
        }
      });

      if (!paymentResult.success) {
        await prisma.investment.update({
          where: { id: investment.id },
          data: { 
            status: 'FAILED',
            failureReason: paymentResult.error 
          }
        });

        return NextResponse.json(
          { error: paymentResult.error },
          { status: 400 }
        );
      }

      // Create escrow transaction
      const escrowResult = await createEscrowTransaction({
        investmentId: investment.id,
        amount,
        currency: project.currency,
        paymentTransactionId: paymentResult.transactionId!,
      });

      // Update investment with payment details
      const updatedInvestment = await prisma.investment.update({
        where: { id: investment.id },
        data: {
          status: 'CONFIRMED',
          paymentTransactionId: paymentResult.transactionId!,
          escrowTransactionId: escrowResult.transactionId,
          confirmedAt: new Date(),
        },
        include: {
          project: {
            select: { title: true }
          }
        }
      });

      // Send confirmation email
      await emailService.sendInvestmentConfirmation(user.email, {
        firstName: user.firstName || 'Investor',
        projectTitle: project.title,
        amount: amount.toString(),
        currency: project.currency,
        transactionId: paymentResult.transactionId!,
      });

      return NextResponse.json({
        investment: updatedInvestment,
        paymentTransaction: paymentResult.transactionId!,
        escrowTransaction: escrowResult.transactionId,
      }, { status: 201 });

    } catch (paymentError) {
      console.error('Payment processing failed:', paymentError);
      
      await prisma.investment.update({
        where: { id: investment.id },
        data: { 
          status: 'FAILED',
          failureReason: 'Payment processing failed'
        }
      });

      return NextResponse.json(
        { error: 'Payment processing failed' },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('Investment creation error:', error);
    return NextResponse.json(
      { error: 'Failed to process investment' },
      { status: 500 }
    );
  }
}

// GET /api/investments - Get user's investments
export async function GET(request: NextRequest) {
  try {
    const authResult = await verifyAuth(request);
    if (!authResult.success) {
      return NextResponse.json(
        { error: authResult.error },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const status = searchParams.get('status');

    const where: any = { userId: authResult.userId! };
    if (status) where.status = status;

    const [investments, total] = await Promise.all([
      prisma.investment.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          project: {
            select: {
              id: true,
              title: true,
              location: true,
              expectedReturn: true,
              duration: true,
              status: true,
            }
          }
        }
      }),
      prisma.investment.count({ where })
    ]);

    return NextResponse.json({
      investments,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Investments fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch investments' },
      { status: 500 }
    );
  }
}