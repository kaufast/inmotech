import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { Decimal } from '@prisma/client/runtime/library';
import prisma from '@/lib/prisma';

const investmentSchema = z.object({
  propertyId: z.string().cuid('Invalid property ID'),
  amount: z.number()
    .positive('Investment amount must be positive')
    .min(1000, 'Minimum investment is €1,000')
    .max(1000000, 'Maximum investment is €1,000,000'),
});

export async function POST(request: NextRequest) {
  try {
    // Extract user info from headers (set by middleware)
    const userId = request.headers.get('x-user-id');
    const userRole = request.headers.get('x-user-role');
    const sessionId = request.headers.get('x-session-id');

    if (!userId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { propertyId, amount } = investmentSchema.parse(body);

    // Get user with investment validation data
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        kycStatus: true,
        isEmailVerified: true,
        investmentLimit: true,
        totalInvested: true,
        investments: {
          where: { propertyId },
          select: { amount: true }
        }
      }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Validate user eligibility
    if (!user.isEmailVerified) {
      return NextResponse.json(
        { error: 'Email verification required before investing' },
        { status: 403 }
      );
    }

    if (user.kycStatus !== 'APPROVED') {
      return NextResponse.json(
        { 
          error: 'KYC verification required before investing',
          kycStatus: user.kycStatus 
        },
        { status: 403 }
      );
    }

    // Check investment limits
    const currentTotalInvested = user.totalInvested.toNumber();
    const investmentLimit = user.investmentLimit?.toNumber() || 0;
    
    if (currentTotalInvested + amount > investmentLimit) {
      return NextResponse.json(
        { 
          error: 'Investment amount exceeds your limit',
          details: {
            requestedAmount: amount,
            currentInvested: currentTotalInvested,
            limit: investmentLimit,
            available: investmentLimit - currentTotalInvested
          }
        },
        { status: 400 }
      );
    }

    // Get property details
    const property = await prisma.property.findUnique({
      where: { id: propertyId },
      select: {
        id: true,
        title: true,
        minInvestment: true,
        targetFunding: true,
        currentFunding: true,
        isActive: true,
        investments: {
          select: { amount: true }
        }
      }
    });

    if (!property) {
      return NextResponse.json(
        { error: 'Property not found' },
        { status: 404 }
      );
    }

    if (!property.isActive) {
      return NextResponse.json(
        { error: 'Property is no longer available for investment' },
        { status: 400 }
      );
    }

    // Validate investment amount
    const minInvestment = property.minInvestment.toNumber();
    if (amount < minInvestment) {
      return NextResponse.json(
        { 
          error: `Minimum investment for this property is €${minInvestment.toLocaleString()}`,
          minInvestment 
        },
        { status: 400 }
      );
    }

    // Check if property funding limit would be exceeded
    const currentFunding = property.currentFunding.toNumber();
    const targetFunding = property.targetFunding.toNumber();
    
    if (currentFunding + amount > targetFunding) {
      return NextResponse.json(
        { 
          error: 'Investment amount exceeds available funding for this property',
          details: {
            requestedAmount: amount,
            currentFunding,
            targetFunding,
            availableFunding: targetFunding - currentFunding
          }
        },
        { status: 400 }
      );
    }

    // Check if user already invested in this property
    const existingInvestment = user.investments.reduce(
      (total, inv) => total + inv.amount.toNumber(), 
      0
    );

    // Create investment transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create the investment
      const investment = await tx.investment.create({
        data: {
          userId,
          propertyId,
          amount: new Decimal(amount),
          status: 'PENDING', // Require manual approval for security
        },
        include: {
          property: {
            select: {
              title: true,
              location: true,
              expectedReturn: true,
            }
          }
        }
      });

      // Update property funding (only for approved investments in real implementation)
      // For now, we'll track pending investments separately
      await tx.property.update({
        where: { id: propertyId },
        data: {
          currentFunding: {
            increment: new Decimal(amount)
          }
        }
      });

      // Update user total invested
      await tx.user.update({
        where: { id: userId },
        data: {
          totalInvested: {
            increment: new Decimal(amount)
          }
        }
      });

      return investment;
    });

    // Log the investment attempt
    await prisma.auditLog.create({
      data: {
        userId,
        action: 'INVESTMENT_CREATED',
        resource: 'INVESTMENT',
        details: JSON.stringify({
          investmentId: result.id,
          propertyId,
          amount,
          sessionId
        }),
        ipAddress: request.ip,
        userAgent: request.headers.get('user-agent'),
      }
    });

    return NextResponse.json({
      investment: {
        id: result.id,
        propertyId: result.propertyId,
        amount: result.amount.toNumber(),
        status: result.status,
        property: result.property,
        createdAt: result.createdAt,
      },
      message: 'Investment created successfully and is pending approval'
    }, { status: 201 });

  } catch (error) {
    console.error('Investment creation error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          error: 'Invalid investment data',
          details: error.errors 
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

export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id');

    if (!userId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const skip = (page - 1) * limit;

    // Get user investments
    const [investments, total] = await prisma.$transaction([
      prisma.investment.findMany({
        where: { userId },
        include: {
          property: {
            select: {
              title: true,
              location: true,
              expectedReturn: true,
              imageUrls: true,
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.investment.count({
        where: { userId }
      })
    ]);

    // Calculate summary
    const summary = await prisma.investment.aggregate({
      where: { userId },
      _sum: { amount: true },
      _count: true,
    });

    return NextResponse.json({
      investments: investments.map(inv => ({
        ...inv,
        amount: inv.amount.toNumber(),
        property: {
          ...inv.property,
          expectedReturn: inv.property.expectedReturn.toNumber(),
        }
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      summary: {
        totalInvested: summary._sum.amount?.toNumber() || 0,
        totalInvestments: summary._count,
      }
    });

  } catch (error) {
    console.error('Get investments error:', error);
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}