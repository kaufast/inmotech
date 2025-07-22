import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/jwt-rbac-middleware';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET /api/investments - Get user's investments (portfolio)
export const GET = withAuth(async (request: NextRequest, user) => {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const opportunityId = searchParams.get('opportunityId');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);
    const offset = (page - 1) * limit;
    
    const where: any = {
      userId: user.userId
    };
    
    if (status) where.status = status;
    if (opportunityId) where.opportunityId = opportunityId;
    
    const [investments, totalCount] = await Promise.all([
      prisma.investment.findMany({
        where,
        include: {
          opportunity: {
            select: {
              id: true,
              title: true,
              investmentType: true,
              category: true,
              riskLevel: true,
              expectedRoi: true,
              investmentPeriod: true,
              status: true,
              images: true,
              creator: {
                select: {
                  firstName: true,
                  lastName: true
                }
              }
            }
          },
          distributions: {
            select: {
              id: true,
              amount: true,
              distributionType: true,
              distributionDate: true,
              status: true
            },
            orderBy: { distributionDate: 'desc' },
            take: 5
          },
          valuationHistory: {
            select: {
              id: true,
              valuationDate: true,
              totalValue: true,
              unrealizedGain: true,
              totalReturn: true
            },
            orderBy: { valuationDate: 'desc' },
            take: 1
          }
        },
        orderBy: { investmentDate: 'desc' },
        take: limit,
        skip: offset
      }),
      prisma.investment.count({ where })
    ]);
    
    // Calculate portfolio metrics
    const portfolioMetrics = {
      totalInvested: investments.reduce((sum, inv) => sum + inv.amount, 0),
      currentValue: investments.reduce((sum, inv) => {
        const latestValuation = inv.valuationHistory[0];
        return sum + (latestValuation?.totalValue || inv.amount);
      }, 0),
      totalDistributions: investments.reduce((sum, inv) => sum + inv.totalDistributions, 0),
      totalReturns: investments.reduce((sum, inv) => sum + inv.totalReturns, 0),
      unrealizedReturns: investments.reduce((sum, inv) => sum + inv.unrealizedReturns, 0)
    };
    
    const totalPages = Math.ceil(totalCount / limit);
    
    return NextResponse.json({
      investments,
      portfolioMetrics,
      pagination: {
        currentPage: page,
        totalPages,
        totalCount,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    });
    
  } catch (error) {
    console.error('Error fetching user investments:', error);
    return NextResponse.json(
      { error: 'Failed to fetch investments' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
});

// POST /api/investments - Create new investment
export const POST = withAuth(async (request: NextRequest, user) => {
  try {
    const { opportunityId, amount, paymentMethod } = await request.json();
    
    // Validate required fields
    if (!opportunityId || !amount || !paymentMethod) {
      return NextResponse.json(
        { error: 'Opportunity ID, amount, and payment method are required' },
        { status: 400 }
      );
    }
    
    // Validate amount
    if (amount <= 0) {
      return NextResponse.json(
        { error: 'Investment amount must be positive' },
        { status: 400 }
      );
    }
    
    // Check if opportunity exists and is available for investment
    const opportunity = await prisma.investmentOpportunity.findUnique({
      where: { id: opportunityId },
      select: {
        id: true,
        title: true,
        targetAmount: true,
        raisedAmount: true,
        minimumInvestment: true,
        maximumInvestment: true,
        status: true,
        isActive: true,
        fundingStartDate: true,
        fundingEndDate: true,
        createdBy: true
      }
    });
    
    if (!opportunity) {
      return NextResponse.json(
        { error: 'Investment opportunity not found' },
        { status: 404 }
      );
    }
    
    if (!opportunity.isActive || opportunity.status !== 'ACTIVE') {
      return NextResponse.json(
        { error: 'Investment opportunity is not currently available' },
        { status: 400 }
      );
    }
    
    // Check if opportunity creator is trying to invest in their own opportunity
    if (opportunity.createdBy === user.userId) {
      return NextResponse.json(
        { error: 'Cannot invest in your own opportunity' },
        { status: 400 }
      );
    }
    
    // Check funding period
    const now = new Date();
    if (now < opportunity.fundingStartDate || now > opportunity.fundingEndDate) {
      return NextResponse.json(
        { error: 'Investment opportunity is not in funding period' },
        { status: 400 }
      );
    }
    
    // Check investment amount constraints
    if (amount < opportunity.minimumInvestment) {
      return NextResponse.json(
        { error: `Minimum investment is €${opportunity.minimumInvestment}` },
        { status: 400 }
      );
    }
    
    if (opportunity.maximumInvestment && amount > opportunity.maximumInvestment) {
      return NextResponse.json(
        { error: `Maximum investment is €${opportunity.maximumInvestment}` },
        { status: 400 }
      );
    }
    
    // Check if this would exceed the target amount
    const potentialTotal = opportunity.raisedAmount + amount;
    if (potentialTotal > opportunity.targetAmount) {
      const remainingAmount = opportunity.targetAmount - opportunity.raisedAmount;
      return NextResponse.json(
        { error: `Only €${remainingAmount} remaining for this opportunity` },
        { status: 400 }
      );
    }
    
    // Check if user has any existing investments in this opportunity
    const existingInvestment = await prisma.investment.findFirst({
      where: {
        userId: user.userId,
        opportunityId,
        status: { in: ['PENDING', 'CONFIRMED', 'ACTIVE'] }
      }
    });
    
    if (existingInvestment && opportunity.maximumInvestment) {
      const totalUserInvestment = existingInvestment.amount + amount;
      if (totalUserInvestment > opportunity.maximumInvestment) {
        return NextResponse.json(
          { error: `Total investment would exceed maximum of €${opportunity.maximumInvestment}` },
          { status: 400 }
        );
      }
    }
    
    // Create the investment
    const investment = await prisma.investment.create({
      data: {
        userId: user.userId,
        opportunityId,
        amount,
        currency: 'EUR', // Default to EUR
        investmentDate: new Date(),
        paymentMethod,
        status: 'PENDING', // Will be updated after payment processing
        paymentStatus: 'PENDING'
      },
      include: {
        opportunity: {
          select: {
            id: true,
            title: true,
            investmentType: true,
            expectedRoi: true,
            investmentPeriod: true
          }
        }
      }
    });
    
    // TODO: Integrate with payment processing (Stripe, PayPal, etc.)
    // For now, we'll simulate payment processing
    
    return NextResponse.json({
      success: true,
      investment,
      message: 'Investment created successfully'
    }, { status: 201 });
    
  } catch (error) {
    console.error('Error creating investment:', error);
    return NextResponse.json(
      { error: 'Failed to create investment' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
});