import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/prisma';
import { rateLimit } from '@/lib/rate-limit';
import { createPaymentIntent } from '@/lib/payment/payment-service';
import { sendInvestmentConfirmationEmail } from '@/lib/sesClient';

// ==================== VALIDATION SCHEMAS ====================

const createInvestmentSchema = z.object({
  projectId: z.string().cuid('Invalid project ID'),
  amount: z.number().positive('Investment amount must be positive'),
  paymentMethod: z.enum(['card', 'bank_transfer', 'sepa', 'crypto']).default('card'),
  currency: z.string().length(3, 'Invalid currency code').default('EUR'),
  acceptTerms: z.boolean().refine(val => val === true, 'You must accept the investment terms'),
  riskAcknowledgment: z.boolean().refine(val => val === true, 'You must acknowledge the investment risks')
});

const queryInvestmentsSchema = z.object({
  page: z.string().transform(Number).default('1'),
  limit: z.string().transform(Number).default('10'),
  status: z.enum(['PENDING', 'PAYMENT_REQUIRED', 'PAYMENT_PROCESSING', 'CONFIRMED', 'ACTIVE', 'COMPLETED', 'CANCELLED', 'REFUNDED', 'FAILED']).optional(),
  projectId: z.string().optional(),
  userId: z.string().optional() // Admin only
});

// ==================== GET /api/investments ====================

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const params = Object.fromEntries(searchParams);
    
    const { page, limit, status, projectId, userId: queryUserId } = queryInvestmentsSchema.parse(params);

    const userId = request.headers.get('user-id');
    const userRole = request.headers.get('user-role');

    if (!userId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Build where clause
    const where: any = {};

    // Non-admin users can only see their own investments
    if (!['ADMIN', 'MODERATOR'].includes(userRole || '')) {
      where.userId = userId;
    } else if (queryUserId) {
      where.userId = queryUserId;
    } else if (!queryUserId && !['ADMIN', 'MODERATOR'].includes(userRole || '')) {
      where.userId = userId;
    }

    if (status) where.status = status;
    if (projectId) where.projectId = projectId;

    // Execute query with pagination
    const skip = (page - 1) * limit;
    const [investments, totalCount] = await Promise.all([
      prisma.investment.findMany({
        where,
        include: {
          project: {
            select: {
              id: true,
              title: true,
              status: true,
              imageUrls: true,
              expectedReturn: true,
              investmentTerm: true,
              targetFunding: true,
              currentFunding: true
            }
          },
          user: userRole === 'ADMIN' || userRole === 'MODERATOR' ? {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true
            }
          } : undefined,
          payments: {
            select: {
              id: true,
              amount: true,
              status: true,
              paymentMethod: true,
              createdAt: true,
              completedAt: true
            },
            orderBy: { createdAt: 'desc' }
          },
          returnPayments: {
            select: {
              id: true,
              amount: true,
              paymentType: true,
              paymentDate: true,
              status: true
            },
            orderBy: { paymentDate: 'desc' }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      }),
      prisma.investment.count({ where })
    ]);

    // Calculate returns and performance for each investment
    const investmentsWithMetrics = investments.map(investment => {
      const confirmedPayments = investment.payments.filter(p => p.status === 'COMPLETED');
      const totalPaid = confirmedPayments.reduce((sum, p) => sum + Number(p.amount), 0);
      const totalReturns = investment.returnPayments
        .filter(rp => rp.status === 'PROCESSED')
        .reduce((sum, rp) => sum + Number(rp.amount), 0);
      
      const currentReturn = totalPaid > 0 ? ((totalReturns / totalPaid) * 100) : 0;
      const maturityDate = investment.maturityDate || new Date(Date.now() + (investment.project.investmentTerm * 30 * 24 * 60 * 60 * 1000));
      const daysToMaturity = Math.max(0, Math.ceil((maturityDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)));

      return {
        ...investment,
        totalPaid,
        totalReturns,
        currentReturn,
        daysToMaturity,
        isActive: investment.status === 'ACTIVE' || investment.status === 'CONFIRMED',
        nextReturnDate: investment.nextReturnDate
      };
    });

    return NextResponse.json({
      investments: investmentsWithMetrics,
      pagination: {
        page,
        limit,
        totalPages: Math.ceil(totalCount / limit),
        totalCount
      }
    });

  } catch (error) {
    console.error('Get investments error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// ==================== POST /api/investments ====================

export async function POST(request: NextRequest) {
  try {
    // Rate limiting: 5 investment attempts per hour per user
    const rateLimitResult = await rateLimit(request, {
      maxRequests: 5,
      windowMs: 60 * 60 * 1000,
      keyGenerator: (req) => `invest-${req.headers.get('user-id')}`
    });

    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'Too many investment attempts. Please try again later.' },
        { status: 429 }
      );
    }

    const userId = request.headers.get('user-id');
    const userKycStatus = request.headers.get('user-kyc-status');

    if (!userId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Check KYC status
    if (userKycStatus !== 'APPROVED') {
      return NextResponse.json(
        { error: 'KYC verification required. Please complete your identity verification before investing.' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { projectId, amount, paymentMethod, currency, acceptTerms, riskAcknowledgment } = createInvestmentSchema.parse(body);

    // Get user details for investment limits and jurisdiction
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        investmentLimit: true,
        totalInvested: true,
        jurisdictionCode: true,
        kycStatus: true
      }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Double-check KYC status
    if (user.kycStatus !== 'APPROVED') {
      return NextResponse.json(
        { error: 'KYC verification required' },
        { status: 403 }
      );
    }

    // Get project details
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: {
        id: true,
        title: true,
        status: true,
        targetFunding: true,
        currentFunding: true,
        minInvestment: true,
        maxInvestment: true,
        fundingDeadline: true,
        expectedReturn: true,
        investmentTerm: true,
        ownerId: true
      }
    });

    if (!project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }

    // Validate investment eligibility
    if (project.status !== 'OPEN') {
      return NextResponse.json(
        { error: 'Project is not open for investment' },
        { status: 400 }
      );
    }

    if (project.fundingDeadline < new Date()) {
      return NextResponse.json(
        { error: 'Funding deadline has passed' },
        { status: 400 }
      );
    }

    if (userId === project.ownerId) {
      return NextResponse.json(
        { error: 'Project owners cannot invest in their own projects' },
        { status: 400 }
      );
    }

    // Validate investment amount
    if (amount < Number(project.minInvestment)) {
      return NextResponse.json(
        { error: `Minimum investment amount is ${project.minInvestment} ${currency}` },
        { status: 400 }
      );
    }

    if (project.maxInvestment && amount > Number(project.maxInvestment)) {
      return NextResponse.json(
        { error: `Maximum investment amount is ${project.maxInvestment} ${currency}` },
        { status: 400 }
      );
    }

    // Check if investment would exceed project funding target
    const newTotalFunding = Number(project.currentFunding) + amount;
    if (newTotalFunding > Number(project.targetFunding)) {
      const remainingAmount = Number(project.targetFunding) - Number(project.currentFunding);
      return NextResponse.json(
        { error: `Investment amount exceeds remaining funding needed. Maximum available: ${remainingAmount} ${currency}` },
        { status: 400 }
      );
    }

    // Check user investment limits
    const newUserTotal = Number(user.totalInvested) + amount;
    if (user.investmentLimit && newUserTotal > Number(user.investmentLimit)) {
      return NextResponse.json(
        { error: `Investment exceeds your investment limit of ${user.investmentLimit} ${currency}` },
        { status: 400 }
      );
    }

    // Calculate investment terms
    const shares = amount / (Number(project.targetFunding) / 100); // Percentage of project
    const maturityDate = new Date(Date.now() + (project.investmentTerm * 30 * 24 * 60 * 60 * 1000));

    // Create investment record
    const investment = await prisma.investment.create({
      data: {
        userId,
        projectId,
        amount,
        shares,
        status: 'PAYMENT_REQUIRED',
        paymentStatus: 'PENDING',
        paymentMethod,
        expectedReturn: project.expectedReturn,
        maturityDate,
        referenceNumber: `INV-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`
      },
      include: {
        project: {
          select: {
            title: true,
            expectedReturn: true,
            investmentTerm: true
          }
        }
      }
    });

    try {
      // Create payment intent with PSP
      const paymentIntent = await createPaymentIntent({
        amount,
        currency,
        paymentMethod,
        userId,
        investmentId: investment.id,
        userJurisdiction: user.jurisdictionCode,
        description: `Investment in ${project.title}`,
        metadata: {
          type: 'investment',
          projectId,
          investmentId: investment.id,
          userId
        }
      });

      // Create payment record
      const payment = await prisma.payment.create({
        data: {
          investmentId: investment.id,
          userId,
          amount,
          currency,
          paymentType: 'INVESTMENT',
          paymentMethod,
          pspProvider: paymentIntent.provider,
          pspTransactionId: paymentIntent.transactionId,
          pspSessionId: paymentIntent.sessionId,
          netAmount: amount - (paymentIntent.processingFee || 0),
          processingFee: paymentIntent.processingFee || 0,
          status: 'PENDING'
        }
      });

      // Update investment with payment intent
      await prisma.investment.update({
        where: { id: investment.id },
        data: {
          paymentIntentId: paymentIntent.transactionId,
          status: 'PAYMENT_PROCESSING'
        }
      });

      // Log investment creation
      await prisma.auditLog.create({
        data: {
          userId,
          action: 'INVESTMENT_CREATED',
          resource: 'INVESTMENT',
          resourceId: investment.id,
          details: JSON.stringify({
            projectId,
            amount,
            currency,
            paymentMethod,
            referenceNumber: investment.referenceNumber
          }),
          ipAddress: request.ip,
          userAgent: request.headers.get('user-agent'),
        }
      });

      return NextResponse.json({
        investment: {
          ...investment,
          payment: {
            id: payment.id,
            status: payment.status,
            amount: payment.amount,
            currency: payment.currency
          }
        },
        paymentIntent: {
          id: paymentIntent.transactionId,
          clientSecret: paymentIntent.clientSecret,
          paymentUrl: paymentIntent.paymentUrl,
          provider: paymentIntent.provider
        },
        message: 'Investment created successfully. Please complete the payment.'
      }, { status: 201 });

    } catch (paymentError) {
      console.error('Payment intent creation failed:', paymentError);
      
      // Update investment status to failed
      await prisma.investment.update({
        where: { id: investment.id },
        data: { 
          status: 'FAILED',
          paymentStatus: 'FAILED'
        }
      });

      return NextResponse.json(
        { error: 'Failed to create payment. Please try again.' },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('Create investment error:', error);
    
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
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}